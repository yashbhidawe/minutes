# Minutes

Meeting notes for Indian sales teams. Captures Hindi, English, and Hinglish sales calls in the same sentence, then gives you timestamps, summaries, and action items. Records tab audio upon call completion, transcribes via Groq Whisper (`whisper-large-v3`), and generates structured summaries and action items using Google Gemini (`gemini-3.8-flash`). Notes and timestamped transcripts are accessible via a Next.js web dashboard. Open source.

---

## Problem

Google Meet does not provide built-in transcription, meeting notes, or action item extraction. Most meeting tools are English-first and handle Hindi, English, and Hinglish mixed in the same sentence poorly. Indian sales teams must take manual notes during calls or rely on separate recording and transcription tools that do not integrate with the meeting context.

## Solution

Minutes is meeting notes for Indian sales teams. It captures tab audio directly from an active Google Meet call, uploads it to a FastAPI backend, runs it through Groq Whisper for speech-to-text and Gemini 3.8 Flash for structured summarization, and surfaces notes, decisions, action items, and timestamped transcripts in a Next.js dashboard. Hindi, English, and Hinglish are captured together — no language selection required before the call. Open source.

---

## Architecture

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

---

## Tech Stack

| Layer | Technology | Purpose |
|:------|:-----------|:--------|
| Backend | FastAPI | API, auth, orchestration |
| Database | PostgreSQL / SQLite | Meeting, transcript, note, action item records |
| ORM | SQLAlchemy 2.0 | Data modeling and repository access |
| Frontend | Next.js 16 (App Router) | Dashboard UI |
| Styling | Tailwind CSS | Component styling |
| Extension | Chrome Extension Manifest V3 | Tab audio capture via `chrome.tabCapture` and `chrome.offscreen` |
| Speech-to-Text | Groq Whisper (`whisper-large-v3`) | Transcription with timestamped segments |
| Summarization | Google Gemini 3.8 Flash | Structured JSON meeting notes and action items; falls back to `gemini-3.5-flash-lite` / `gemini-3.1-flash-lite` |
| Storage | Cloudflare R2 | Audio file persistence |
| Auth | JWT (`python-jose`), bcrypt (`passlib`) | User authentication |

---

## Repository Structure

```
minutes/
├── server/
│   ├── app/
│   │   ├── api/          # Route handlers (users, meetings)
│   │   ├── services/     # Business logic (audio, storage, transcription, summarization)
│   │   ├── repositories/ # Database access layer
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic request/response schemas
│   │   ├── core/         # Database connection & Cloudflare R2 client
│   │   └── utils/        # JWT authentication & password validation
│   ├── main.py           # FastAPI app entry point & CORS configuration
│   └── requirements.txt
├── client/
│   ├── app/              # App Router pages
│   ├── components/       # React components
│   └── lib/              # Auth context & API client
├── extension/
│   ├── manifest.json
│   ├── background.js     # Service worker: meeting state & upload coordination
│   ├── offscreen.html    # Offscreen document host
│   ├── offscreen.js      # MediaRecorder tab audio capture & AudioContext passthrough
│   ├── content.js        # Google Meet DOM detection
│   ├── popup.html        # Extension popup UI
│   └── popup.js          # Authentication & status controller
├── AGENTS.md             # Contributor & AI assistant guidelines
├── docker-compose.yml
├── Caddyfile
└── README.md
```

---

## How It Works

1. **Meeting detection** — `content.js` monitors the Google Meet DOM and signals `background.js` when a call starts or ends.
2. **Tab audio capture** — `background.js` obtains a tab stream ID through `chrome.tabCapture.getMediaStreamId` and spawns `offscreen.html`. Because Manifest V3 service workers cannot access `MediaRecorder` or Web Audio APIs directly, recording happens in the offscreen document.
3. **Audio passthrough** — `offscreen.js` pipes captured audio through `AudioContext.destination` so meeting participants remain audible to the user during recording.
4. **Upload** — `background.js` uploads the WebM audio blob to `/meetings/{id}/upload-audio`.
5. **Storage** — The backend streams audio to Cloudflare R2.
6. **Transcription** — Groq Whisper transcribes audio into raw text and timestamped segments. Long recordings are sliced into 10-minute chunks with offset re-stitching to bypass the 25 MB file limit.
7. **Summarization** — Gemini 3.8 Flash analyzes the transcript and returns structured JSON with key decisions, discussion points, blockers, next steps, and action items. Falls back to `gemini-3.5-flash-lite` or `gemini-3.1-flash-lite` if the primary model is rate-limited.
8. **Dashboard** — Notes, action items, and timestamped transcripts are displayed in the Next.js web dashboard.

---

## Key Engineering Decisions

- **Offscreen documents for Manifest V3**: Service workers lack DOM and MediaRecorder access, so tab capture is delegated to an offscreen document launched from the service worker.
- **Repository pattern**: Database operations are confined to repository classes in `app/repositories/`; API routers do not contain inline SQL.
- **Callable timestamp defaults**: ORM timestamp columns use `default=lambda: ...` to prevent static evaluation at server startup.
- **Audio chunking**: Long recordings are split into 10-minute chunks with offset re-stitching to stay within Groq Whisper's file size limit.
- **CORS origin regex**: Configured to allow localhost, Vercel deployments, and `chrome-extension://` origins.

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| POST | `/users/` | Register a new user |
| POST | `/users/login` | Authenticate and receive JWT |

### Meetings

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| GET | `/meetings/` | List user meetings |
| POST | `/meetings/` | Create a meeting instance |
| GET | `/meetings/{id}` | Get meeting metadata |
| DELETE | `/meetings/{id}` | Delete meeting and related data |
| POST | `/meetings/{id}/upload-audio` | Upload WebM/WAV audio blob |
| GET | `/meetings/{id}/transcript` | Retrieve transcript and segments |
| POST | `/meetings/{id}/transcribe` | Run Whisper transcription |
| POST | `/meetings/{id}/summarize` | Run Gemini summarization |
| GET | `/meetings/{id}/notes` | Get generated meeting notes |
| GET | `/meetings/{id}/action-items` | Get extracted action items |
| PATCH | `/meetings/{id}/action-items/{item_id}` | Update action item status |

---

## Local Development

### Prerequisites

- Python 3.11+
- Node.js 18+

### Backend

```bash
cd server
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd client
npm install
npm run dev
```

Dashboard runs on `http://localhost:3000`.

### Chrome Extension

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click **Load unpacked** and select the `extension/` directory.
4. Open the extension popup and log in.

### Environment Variables

Create `server/.env`:

```env
JWT_SECRET_KEY=your_random_jwt_secret_key
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=minutes
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

Create `client/.env.local` if needed:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Never commit real secrets to version control.

---

## Deployment

- **Frontend**: Vercel (`client/`)
- **Backend**: Render.com (`server/`)
  - Root Directory: `server`
  - Build Command: `pip install -r requirements.txt`
  - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

---

## Project Status

- JWT authentication with bcrypt password hashing
- Chrome Extension tab capture via `chrome.offscreen` and `MediaRecorder`
- Cloudflare R2 audio persistence
- FFmpeg-based 10-minute audio chunking with offset re-stitching
- FastAPI BackgroundTasks for asynchronous transcription and summarization
- Groq Whisper speech-to-text with timestamped segments
- Gemini 3.8 Flash structured JSON summarization
- Next.js dashboard with meeting list, detail view, action item status toggles, and transcript viewer

---

## Contributing

1. Fork the repository.
2. Create a feature branch from `main`.
3. Make your changes and add tests where applicable.
4. Ensure `python3 -m py_compile` passes for backend changes.
5. Ensure `npm run build` passes for frontend changes.
6. Open a pull request with a clear description of the change and motivation.

---

## License

MIT