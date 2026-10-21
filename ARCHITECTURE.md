# Architecture

This document explains how Minutes works end-to-end and, more importantly, why it is built the way it is. Each major decision is paired with the alternative that was rejected and the tradeoff that was accepted.

## System Overview

```
[ Google Meet Call ]
        │  (tab audio capture)
        ▼
[ Chrome Extension (MV3) ] ──► MediaRecorder in offscreen document ──► .webm blob
        │  (JWT auth, status polling)                                        │
        ▼                                                                    │
[ Next.js Dashboard ] ◄───────────────────────────────► [ FastAPI Backend ] ◄─┘
                                                              │
                                        ┌────────────────────┼────────────────────┐
                                        ▼                    ▼                    ▼
                              [ Cloudflare R2 ]      [ Groq Whisper ]      [ Gemini ]
                              (audio persistence)   (speech-to-text)   (summaries + embeddings)
                                        │                    │                    │
                                        └────────────────────┼────────────────────┘
                                                             ▼
                              [ SQLite / PostgreSQL ]
                              (transcripts, notes,
                               action items, chunks,
                               embeddings)

   Redis + Celery (optional) — broker and worker that run the
   pipeline out of band; the database is written by the
   pipeline itself, not by the queue.
```

## Components

### Chrome Extension (`extension/`)

Manifest V3, seven JS files plus three HTML pages. The interesting split is *who has a DOM*:

- **`content.js`** (content script, injected into the Meet tab) — the only component that can see the page. It decides whether a real call is in progress by checking the host, matching the `/abc-defg-hij` meeting-code path, and probing for the leave button and the mic/camera toolbar. It also renders the in-page recording widget and elapsed-time counter.
- **`background.js`** (service worker) — owns the recording state machine, exchanges credentials with the backend, and brokers the capture handshake. Because MV3 service workers have no DOM, it cannot touch `MediaRecorder` directly.
- **`offscreen.html` / `offscreen.js`** — a dedicated offscreen document created with `chrome.offscreen` that performs the actual capture. `background.js` obtains a stream handle via `chrome.tabCapture.getMediaStreamId({ targetTabId })`, passes the ID to the offscreen document, which builds a `MediaStream` and feeds it to `MediaRecorder`, producing a `.webm` blob.
- **Speaker playback** — the captured stream is also piped through `AudioContext.destination` so the user still hears the meeting while it is being recorded. Without this, tab capture mutes the call for the user even though the recorder still captures it.
- **`popup.js`** / **`permissions.js`** — the toolbar popup and the one-time screen-capture permission grant.
- **`dashboard-sync.js`** — bridges the dashboard's auth state into the extension over `postMessage`, so the two surfaces agree on who is signed in.
- **`config.js`** — the single source of truth for the backend and dashboard URLs. `build.sh` rewrites it with production values when packaging; every other file reads it and falls back to localhost.

Recording state and the JWT live in `chrome.storage.local` so they survive service-worker evictions. The extension also sends the captured duration as an `X-Recording-Duration` header on upload, so the backend stores the real recording length instead of a client-side guess.

### Web Dashboard (`client/`)

Next.js 16 App Router frontend. All network calls are encapsulated in `lib/api.ts`; authentication lives in `lib/auth-context.tsx`, which validates the JWT client-side and treats locally-detected expiry as a logout. The dashboard lists meetings, shows status badges, renders timestamped transcripts with click-to-seek into the stored audio, displays notes and action items, and hosts the chat (RAG) UI.

### Backend (`server/`)

FastAPI application organized in strict layers:

```
app/
├── api/           # routers: users, meetings, chat — no SQL here, ever
├── repositories/  # database access, one repository per model
├── services/      # business logic + external integrations
├── models/        # SQLAlchemy ORM models
├── schemas/       # Pydantic request/response models
├── core/          # engine/session, Celery app, R2 client
└── utils/         # JWT auth dependency
```

- **API layer** (`app/api/`) — validates input via Pydantic, checks ownership, delegates to repositories/services, never writes SQL inline.
- **Repository layer** (`app/repositories/`) — where database access is centralised. One repository per model.
- **Service layer** (`app/services/`) — integrations (Groq, Gemini, R2), the processing pipeline, audio chunking, transcript chunking/embeddings, and RAG.

## Data Model

| Table | Purpose |
|---|---|
| `users` | Accounts; bcrypt-hashed passwords |
| `meetings` | One row per recording: title, `duration_sec`, `audio_key` (R2), processing `status`, `error_message` |
| `transcripts` | Raw text + `segments` (JSON: start/end/text per segment) |
| `notes` | Summary sections (`key_decisions`, `discussion_points`, `blockers`, `next_steps`); one row per section, `section` + `content` |
| `action_items` | Extracted tasks with mutable status, plus `assigned_to`, `due_date`, `priority` |
| `meeting_chunks` | RAG index: chunk text, `start_sec`/`end_sec`, embedding stored as JSON |

## Processing Pipeline

A meeting moves through a status machine: `pending → queued → transcribing → transcribed → summarizing → completed`, with `failed` as the error state carrying `error_message`. `pending` is the column default for a freshly created meeting; `queued` is set when the audio lands in R2.

`POST /meetings/{id}/upload-audio` stores the raw `.webm` in R2, sets the status to `queued`, and hands off to `dispatch_meeting_task`, which picks one of three execution modes for the same `execute_meeting_pipeline` function: a Celery task (Redis broker) when `ENABLE_CELERY` is set and the enqueue succeeds, a FastAPI `BackgroundTask` when it is disabled or the broker is unreachable, and a direct synchronous call for CLI and test runs. One code path, three execution modes.

Inside the pipeline (idempotent, so retries and reprocesses never duplicate rows):

1. **Download** the audio from R2.
2. **Chunk** it with Pydub/FFmpeg if needed — files over 20 MB or 10 minutes are split into ≤10-minute segments re-encoded to 64 kbps mono MP3. A recording under both thresholds is passed to Groq untouched. Each chunk returns a `start_offset_seconds`, so later timestamps can be stitched back to absolute positions in the original recording.
3. **Transcribe** each chunk with Groq's `whisper-large-v3` (`verbose_json`, segment-level timestamps). Segment times are offset by the chunk offset and concatenated.
4. **Summarize** the full transcript with Gemini in native JSON mode: four note sections plus structured action items. When Gemini is **overloaded or 503** the call walks down a fallback chain — `gemini-3.8-flash → gemini-3.5-flash-lite → gemini-3.1-flash-lite` — with three attempts and exponential backoff (2 s base) per model before the next one is tried.
5. **Persist** everything and mark the meeting `completed`.

`POST /meetings/{id}/reprocess` re-runs the pipeline and rejects with `409` if the meeting is mid-flight (`BUSY_STATUSES`). Transcribe and summarize are also available as synchronous on-demand endpoints for fine-grained retries.

### Why Celery is optional

Reliability settings (`acks_late`, `reject_on_worker_lost`, prefetch 1, 1500 s soft / 1800 s hard limits) make a lost worker or a killed task a retry instead of a stuck meeting. But requiring Redis would complicate local development and small deployments, so the same pipeline function is callable from `BackgroundTasks`. `ENABLE_CELERY` defaults to on, and the Celery path degrades to `BackgroundTasks` on its own if the broker is unreachable — so a missing Redis is a fallback, not a configuration step. The tradeoff: without Celery there are no automatic retries and the request process does the work — acceptable for single-user dev, not for production load.

## RAG Chat

Chat (`/meetings/{id}/ask` and `/chat/ask`) answers questions **with citations back to timestamps**.

1. **Chunking** (`services/chunking.py`) — Whisper segments are grouped into ~1000-character windows with 1-segment overlap, capped at 500 chunks. Chunks carry `start_sec`/`end_sec`; legacy transcripts without segments fall back to plain-text windowing with 150-char overlap.
2. **Embeddings** (`services/embeddings.py`) — `gemini-embedding-001`, batched 100 at a time. Vectors are stored as JSON in `meeting_chunks`. The first `ask` against a meeting auto-indexes it, so pre-RAG meetings work without a manual step.
3. **Retrieval** (`services/rag.py`) — cosine similarity computed in Python over the meeting's chunks. Per-meeting queries take the top 5 by default (max 12); global queries take the top 8 across all of the user's meetings with a diversity cap of 3 chunks per meeting so one long meeting can't dominate the context.
4. **Answering** — Gemini receives the excerpts with a strict prompt: answer with JSON, cite only excerpt indices, never invent timestamps or names. The prompt asks for at most 5 citations; the code then maps every valid index Gemini returns back to `start_sec`/`end_sec` so the dashboard can click-to-seek the original audio, and drops any index that does not correspond to a real retrieved chunk.

### Why no vector database

The natural alternative is pgvector, Pinecone, or similar. Rejected because the retrieval scope is one user's meetings — at most a few hundred chunks — and brute-force cosine similarity over that is sub-millisecond. Adding a vector store would buy nothing except a second stateful system to run, back up, and keep in sync with Postgres. This is a deliberate scope-appropriate simplification, not an oversight; if the corpus ever grows, the chunk/embedding storage is already normalized and only the retrieval step needs to change.

## Key Engineering Decisions

1. **Tab capture delegated to an offscreen document.** MV3 service workers cannot use DOM APIs. `MediaRecorder` must live somewhere with a DOM, hence the offscreen document. The stream ID handshake between `background.js` and `offscreen.js` is the trickiest part of the extension.
2. **Speaker playback through `AudioContext.destination`.** Tab capture steals the audio path; without re-piping it the recorder hears the call but the user doesn't. Small detail, large UX consequence.
3. **Time-stamped chunking with offset stitching.** Whisper's per-chunk timestamps are chunk-relative; the chunker returns offsets so segments are re-anchored to the original recording. This is what makes click-to-seek and RAG citations work on long meetings.
4. **Re-encode chunks to 64 kbps mono MP3.** Cuts upload size dramatically with no meaningful loss for speech-to-text, and keeps every chunk under Whisper/Groq request limits.
5. **Native JSON response mode for Gemini.** `response_mime_type="application/json"` instead of parsing free-form text. Structured output fails loudly rather than subtly.
6. **Model fallback chain.** Overload and 503s on a popular model are routine; degrading to flash-lite keeps the pipeline finishing rather than erroring a whole meeting. The chain is deliberately narrow — it fires on overload signals only, so a real bug or a bad prompt surfaces immediately instead of being retried three times against three different models.
7. **Idempotent, re-runnable pipeline.** Each stage deletes and rewrites its own artifacts, so a retry replaces results instead of appending to them. Notes and action items are only wiped *after* summarization succeeds, so a failed summarize leaves the previous good output intact. Combined with late-ack Celery semantics, crashed workers and retries converge to a clean state instead of duplicating rows.
8. **Schema bootstrap with `ensure_schema()`.** `create_all` never alters existing tables, so the startup hook backfills columns added after a database was created (`meetings.error_message`, `transcripts.segments`). SQLite-first development with a `postgres://` → `postgresql+psycopg://` rewrite for production. Tradeoff: this is a pragmatic bootstrap, not a full migration discipline — the `alembic` dependency is installed but no migration environment is configured yet, so `ensure_schema()` is the only thing keeping an existing database in sync.
9. **Repository pattern enforced.** API routers contain zero SQL — every query goes through a repository class, with two deliberate exceptions: the auth dependency loads the current user directly, and the global RAG path runs a single join query across chunks and meetings. This keeps the sync/async execution question (Celery vs BackgroundTasks) and the storage question (SQLite vs Postgres) from leaking into business logic.
10. **Ownership as 404.** Meeting endpoints return 404 — not 403 — when the resource belongs to another user, so the API does not confirm that a meeting ID exists.

## Security

- JWT bearer tokens (`python-jose`), bcrypt password hashing (via the `bcrypt` library directly — no `passlib` wrapper), and client-side expiry checks on the dashboard.
- Every meeting-scoped endpoint verifies `meeting.user_id == authenticated_user.id`.
- CORS is a strict regex: localhost, `127.0.0.1`, Vercel preview/production domains, `*.nip.io` (used for the tunneled production API), and `chrome-extension://` origins only.

## Deployment

- **Frontend:** Vercel (`client/`), production at `minutes.itsokyash.online`.
- **Backend:** Docker image deployed to an Oracle Cloud VM via GitHub Actions (`deploy-oracle.yml`); Caddy terminates TLS in front of FastAPI at a `nip.io` hostname, with the extension and the Vercel dashboard both calling the API over HTTPS.
- **Optional infra:** Redis for Celery; the pipeline falls back to background tasks when it is absent.
- **Extension packaging:** `extension/build.sh` rewrites `config.js` with the production URLs, builds a versioned zip, and publishes it to `client/public/` where `/install` serves it.

## Testing

Pytest suite in `server/tests/` covers the audio chunker, the audio and storage/R2 services, Celery tasks, repositories, the meetings API, the user service, and the transcription/summarization services with mocked providers. CI runs the suite on every push to `dev` and `main` (`.github/workflows/tests.yml`).

Not yet covered by tests: the chat/RAG endpoints, the embedding and chunking services, and the auth dependency.
