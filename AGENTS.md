# AGENTS.md — Minutes Developer & AI Assistant Guidelines

This document provides instructions, conventions, and architectural context for AI assistants and software engineers working on the **Minutes** codebase.

---

## 1. System Architecture & Overview

Minutes consists of three interconnected subsystems:

```
[ Google Meet Call ]
        │
        ▼ (DOM Detection)
[ Chrome Extension ] ──(tab capture via offscreen.html)──► [ WebM Audio Blob ]
        │                                                           │
        │ (JWT Auth & Status)                                       │ (POST /meetings/{id}/upload-audio)
        ▼                                                           ▼
[ Next.js Web Dashboard ] ◄───────────────────────────────── [ FastAPI Backend ]
                                                                    │
                                                      ┌─────────────┴─────────────┐
                                                      ▼                           ▼
                                             [ Groq Whisper API ]         [ Gemini 3.8 Flash ]
                                            (Speech-to-Text)             (JSON Summarization)
```

1. **`server/` (FastAPI Backend)**: Handles auth, SQL database records, Cloudflare R2 audio persistence, Groq Whisper transcription, and Gemini 3.8 Flash summarization.
2. **`extension/` (Chrome Extension V3)**: Detects Google Meet sessions, spawns an offscreen audio recorder document (`offscreen.html`), records tab audio into `.webm` format via `MediaRecorder`, and uploads audio directly to the backend.
3. **`client/` (Next.js 16 Web Dashboard)**: App Router frontend for reviewing meeting notes, managing action item statuses, and reading timestamped transcripts.

---

## 2. Subsystem Development Rules

### A. FastAPI Backend (`server/`)

- **ORM Models (`app/models/`)**: Always use callable lambdas for timestamp defaults to prevent static evaluation at server startup:
  ```python
  # CORRECT:
  created_at = mapped_column(String(50), nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())

  # INCORRECT (DO NOT USE):
  created_at = mapped_column(String(50), nullable=False, default=datetime.now(timezone.utc).isoformat())
  ```
- **Gemini AI Integration (`app/services/summarization.py`)**: Use native JSON response mode in `google-genai` SDK:
  ```python
  config = types.GenerateContentConfig(response_mime_type="application/json")
  ```
- **CORS Configuration (`main.py`)**: Maintain origin regex matching local dev, Vercel deployments (`https://*.vercel.app`), and Chrome Extension origins:
  ```python
  allow_origin_regex = r"^(http://localhost:\d+|http://127\.0\.0\.1:\d+|https://.*\.itsokyash\.online|https://itsokyash\.online|https://.*\.vercel\.app|https://.*\.nip\.io|chrome-extension://.*)$"
  ```
- **Repository Pattern**: Database operations must go through repository classes (`app/repositories/`). Do not write inline SQL queries inside API router files.

### B. Chrome Extension Manifest V3 (`extension/`)

- **Offscreen Audio Recording (`offscreen.js`)**:
  - Service workers in Manifest V3 cannot access DOM APIs like `MediaRecorder` or Web Audio API directly.
  - Tab capture must be initiated from `background.js` via `chrome.tabCapture.getMediaStreamId({ targetTabId: tabId })` and passed to an offscreen document (`offscreen.html`).
  - **Speaker Playback**: Always pipe captured tab audio streams through `AudioContext.destination` in `offscreen.js` so meeting participants remain audible to the user during recording:
    ```javascript
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(audioContext.destination);
    ```
- **State Persistence**: Store authentication tokens and `recordingState` in `chrome.storage.local`.

### C. Next.js Web Dashboard (`client/`)

- **Styling**: Use Vanilla CSS / Tailwind CSS with modern minimalist aesthetics (monochrome stone palette, clean typography, dynamic status badges).
- **API Client (`lib/api.ts`)**: Keep all API network requests encapsulated inside the `api` object.
- **Auth Context (`lib/auth-context.tsx`)**: Use JWT token validation with automatic client expiration checking.

---

## 3. Development Commands

### Backend (`server/`)

```bash
# Activate virtual environment
source venv/bin/activate

# Run backend server locally
uvicorn app.main:app --reload --port 8000

# Lint (same rules CI enforces)
ruff check .

# Run the test suite
pytest -q

# Run the test suite with coverage
pytest -q --cov=app --cov-report=term-missing:skip-covered
```

**The test suite is hermetic.** `server/tests/conftest.py` redirects `DATABASE_URL` to a
temporary SQLite file and blanks the provider API keys *before* any `app.*` module is
imported. Do not remove that guard: `server/.env` points at the production database and
`app.main` calls `ensure_schema()` at import time, so a test run without it would issue
DDL against production.

### Frontend (`client/`)

```bash
# Install dependencies
npm ci

# Start dev server
npm run dev

# Lint (same rules CI enforces)
npm run lint -- --max-warnings=0

# Build production bundle / verify TypeScript compilation
npm run build
```

### CI (`.github/workflows/ci.yml`)

Four independent gates run on every push and pull request to `dev`/`main`:
`lint-server` (Ruff), `test-server` (pytest + coverage), `lint-client` (ESLint), and
`build-client` (`next build`). Keep them green before pushing — a change that breaks
lint or tests will block the deploy workflow.

---

## 4. Key Environment Variables

Ensure `.env` files are populated in `server/` before testing AI integrations:
- `JWT_SECRET_KEY`
- `GROQ_API_KEY`
- `GEMINI_API_KEY`
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`



