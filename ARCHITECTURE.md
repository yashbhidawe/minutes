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
                                        │
                                        ▼
                              [ SQLite / PostgreSQL ]  ◄──  Redis + Celery (optional)
                              (transcripts, notes,
                               chunks, embeddings)
```

## Components

### Chrome Extension (`extension/`)

Manifest V3 with three moving parts:

- **`background.js`** (service worker) — detects Google Meet sessions, exchanges credentials with the backend, and owns the recording state machine. Because MV3 service workers have no DOM, it cannot touch `MediaRecorder` directly.
- **`offscreen.html` / `offscreen.js`** — a dedicated offscreen document created with `chrome.offscreen` that performs the actual capture. `background.js` obtains a stream handle via `chrome.tabCapture.getMediaStreamId({ targetTabId })`, passes the ID to the offscreen document, which builds a `MediaStream` and feeds it to `MediaRecorder`, producing a `.webm` blob.
- **Speaker playback** — the captured stream is also piped through `AudioContext.destination` so the user still hears the meeting while it is being recorded. Without this, tab capture mutes the call for the recorder.
- Recording state and the JWT live in `chrome.storage.local` so they survive service-worker evictions.

### Web Dashboard (`client/`)

Next.js 16 App Router frontend. All network calls are encapsulated in `lib/api.ts`; authentication lives in `lib/auth-context.tsx`, which validates the JWT client-side and treats locally-detected expiry as a logout. The dashboard lists meetings, shows status badges, renders timestamped transcripts with click-to-seek into the stored audio, displays notes and action items, and hosts the chat (RAG) UI.

### Backend (`server/`)

FastAPI application organized in strict layers:

```
app/
├── api/           # routers: users, meetings, chat — no SQL here, ever
├── repositories/  # all database access goes through repository classes
├── services/      # business logic + external integrations
├── models/        # SQLAlchemy ORM models
├── schemas/       # Pydantic request/response models
├── core/          # engine/session, Celery app, R2 client
└── utils/         # JWT auth dependency
```

- **API layer** (`app/api/`) — validates input via Pydantic, checks ownership, delegates to repositories/services, never writes SQL inline.
- **Repository layer** (`app/repositories/`) — the only place that touches the database. One repository per model.
- **Service layer** (`app/services/`) — integrations (Groq, Gemini, R2), the processing pipeline, audio chunking, transcript chunking/embeddings, and RAG.

## Data Model

| Table | Purpose |
|---|---|
| `users` | Accounts; bcrypt-hashed passwords |
| `meetings` | One row per recording: title, duration, `audio_key` (R2), processing `status`, `error_message` |
| `transcripts` | Raw text + `segments` (JSON: start/end/text per segment) |
| `notes` | Summary sections (`key_decisions`, `discussion_points`, `blockers`, `next_steps`) |
| `action_items` | Extracted tasks with mutable status |
| `meeting_chunks` | RAG index: chunk text, `start_sec`/`end_sec`, embedding stored as JSON |

## Processing Pipeline

A meeting moves through a status machine: `queued → transcribing → transcribed → summarizing → completed` (with an error state carrying `error_message`).

`POST /meetings/{id}/upload-audio` stores the raw `.webm` in R2, sets the status to `queued`, and dispatches `execute_meeting_pipeline`. Depending on the `ENABLE_CELERY` flag this runs either as a Celery task (Redis broker) or, in environments without Redis, as a FastAPI `BackgroundTask` — one code path, two execution modes.

Inside the pipeline (idempotent: it deletes existing transcript/notes/action items for the meeting before rewriting, so reprocessing never duplicates data):

1. **Download** the audio from R2.
2. **Chunk** it with Pydub/FFmpeg if needed — files over 20 MB or 10 minutes are split into ≤10-minute segments re-encoded to 64 kbps mono MP3. Each chunk returns a `start_offset_seconds`, so later timestamps can be stitched back to absolute positions in the original recording.
3. **Transcribe** each chunk with Groq's `whisper-large-v3` (`verbose_json`, segment-level timestamps). Segment times are offset by the chunk offset and concatenated.
4. **Summarize** the full transcript with Gemini in native JSON mode: four note sections plus structured action items. On rate limits the call falls through `gemini-3.8-flash → gemini-3.5-flash-lite → gemini-3.1-flash-lite`.
5. **Persist** everything and mark the meeting `completed`.

`POST /meetings/{id}/reprocess` re-runs the pipeline and rejects with `409` if the meeting is mid-flight (`BUSY_STATUSES`). Transcribe and summarize are also available as synchronous on-demand endpoints for fine-grained retries.

### Why Celery is optional

Reliability settings (`acks_late`, `reject_on_worker_lost`, prefetch 1, 1500 s soft / 1800 s hard limits) make a lost worker or a killed task a retry instead of a stuck meeting. But requiring Redis would complicate local development and small deployments, so the same pipeline function is callable from `BackgroundTasks` behind the `ENABLE_CELERY` flag. The tradeoff: without Celery there are no automatic retries and the request process does the work — acceptable for single-user dev, not for production load.

## RAG Chat

Chat (`/meetings/{id}/ask` and `/chat/ask`) answers questions **with citations back to timestamps**.

1. **Chunking** (`services/chunking.py`) — Whisper segments are grouped into ~1000-character windows with 1-segment overlap, capped at 500 chunks. Chunks carry `start_sec`/`end_sec`; legacy transcripts without segments fall back to plain-text windowing with 150-char overlap.
2. **Embeddings** (`services/embeddings.py`) — `gemini-embedding-001`, batched 100 at a time. Vectors are stored as JSON in `meeting_chunks`. The first `ask` against a meeting auto-indexes it, so pre-RAG meetings work without a manual step.
3. **Retrieval** (`services/rag.py`) — cosine similarity computed in Python over the meeting's chunks. Per-meeting queries take the top 5 by default (max 12); global queries take the top 8 across all of the user's meetings with a diversity cap of 3 chunks per meeting so one long meeting can't dominate the context.
4. **Answering** — Gemini receives the excerpts with a strict prompt: answer with JSON, cite only excerpt indices, never invent timestamps or names. Up to 5 citations are returned, each mapped back to `start_sec`/`end_sec` so the dashboard can click-to-seek the original audio.

### Why no vector database

The natural alternative is pgvector, Pinecone, or similar. Rejected because the retrieval scope is one user's meetings — at most a few hundred chunks — and brute-force cosine similarity over that is sub-millisecond. Adding a vector store would buy nothing except a second stateful system to run, back up, and keep in sync with Postgres. This is a deliberate scope-appropriate simplification, not an oversight; if the corpus ever grows, the chunk/embedding storage is already normalized and only the retrieval step needs to change.

## Key Engineering Decisions

1. **Tab capture delegated to an offscreen document.** MV3 service workers cannot use DOM APIs. `MediaRecorder` must live somewhere with a DOM, hence the offscreen document. The stream ID handshake between `background.js` and `offscreen.js` is the trickiest part of the extension.
2. **Speaker playback through `AudioContext.destination`.** Tab capture steals the audio path; without re-piping it the recorder hears the call but the user doesn't. Small detail, large UX consequence.
3. **Time-stamped chunking with offset stitching.** Whisper's per-chunk timestamps are chunk-relative; the chunker returns offsets so segments are re-anchored to the original recording. This is what makes click-to-seek and RAG citations work on long meetings.
4. **Re-encode chunks to 64 kbps mono MP3.** Cuts upload size dramatically with no meaningful loss for speech-to-text, and keeps every chunk under Whisper/Groq request limits.
5. **Native JSON response mode for Gemini.** `response_mime_type="application/json"` instead of parsing free-form text. Structured output fails loudly rather than subtly.
6. **Model fallback chain.** Rate limits on a popular model are routine; degrading to flash-lite keeps the pipeline finishing rather than erroring a whole meeting because of a 429.
7. **Idempotent, re-runnable pipeline.** Every stage wipes and rewrites its own artifacts; combined with late-ack Celery semantics, crashed workers and retries converge to a clean state instead of duplicating rows.
8. **Schema bootstrap with `ensure_schema()`.** `create_all` never alters existing tables, so the startup hook backfills columns added after a database was created (e.g. `meetings.error_message`). SQLite-first development with a `postgres://` → `postgresql+psycopg://` rewrite for production. Tradeoff: this is a pragmatic bootstrap, not a full migration discipline — Alembic exists in the repo for schema history.
9. **Repository pattern enforced.** API routers contain zero SQL. This keeps the sync/async execution question (Celery vs BackgroundTasks) and the storage question (SQLite vs Postgres) from leaking into business logic.
10. **Ownership as 404.** Meeting endpoints return 404 — not 403 — when the resource belongs to another user, so the API does not confirm that a meeting ID exists.

## Security

- JWT bearer tokens (`python-jose`), bcrypt password hashing (`passlib`), and client-side expiry checks on the dashboard.
- Every meeting-scoped endpoint verifies `meeting.user_id == authenticated_user.id`.
- CORS is a strict regex: localhost, Vercel preview/production domains, and `chrome-extension://` origins only.

## Deployment

- **Frontend:** Vercel (`client/`), production at `minutes.itsokyash.online`.
- **Backend:** Docker image deployed to an Oracle Cloud VM via GitHub Actions (`deploy-oracle.yml`); Caddy terminates TLS in front of FastAPI.
- **Optional infra:** Redis for Celery; the pipeline falls back to background tasks when it is absent.

## Testing

Pytest suite in `server/tests/` covers the audio chunker, the storage/R2 service, Celery tasks, repositories, the meetings API, and the transcription/summarization services with mocked providers. CI for the test suite is on the roadmap.
