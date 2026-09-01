# Minute AI

Automatic meeting notes for Google Meet. Records tab audio upon call completion, transcribes via Groq Whisper (`whisper-large-v3`), and generates structured summaries and action items using Google Gemini (`gemini-3.6-flash`). Notes and timestamped transcripts are stored and accessible via a Next.js web dashboard.

---

## Overview

**Minute AI** is an intelligent meeting assistant pairing a Manifest V3 Chrome Extension with a FastAPI backend and a Next.js web dashboard. It captures Google Meet tab audio automatically without requiring host permissions, processes it through a serverless AI pipeline (with audio chunking & GCP Cloud Tasks queueing), and surfaces clean meeting notes, key decisions, action items, and timestamped transcripts within minutes of the call ending.

Built for small teams, managers, and individuals who want full meeting context without manual note-taking.

---

## Stack

- **Backend** — FastAPI, PostgreSQL / SQLite, SQLAlchemy, Pydantic v2
- **Async Processing** — FastAPI `BackgroundTasks` (asynchronous pipeline execution)
- **Audio Processing** — FFmpeg & Pydub (Automatic 10-min slicing to bypass 25MB Whisper limits)
- **Frontend** — Next.js 16 (App Router), Tailwind CSS, TypeScript
- **Extension** — Vanilla JS, Chrome Extensions Manifest V3 (`chrome.offscreen` + `chrome.tabCapture`)
- **AI Pipeline** — Groq Whisper (`whisper-large-v3` for speech-to-text), Google Gemini (`gemini-3.6-flash` for JSON summarization)
- **Storage** — Cloudflare R2 (audio persistence)
- **Auth** — JWT (`python-jose`), bcrypt password hashing (`passlib`)
- **Deployment** — Vercel (Frontend Dashboard) & Render (Backend Web Service)

---

## Repository Structure

```
minuteai/
├── server/                   # FastAPI backend
│   ├── app/
│   │   ├── api/              # Route handlers (users, meetings)
│   │   ├── services/         # Business logic (user, audio, storage, transcription, summarization)
│   │   ├── repositories/     # Database queries (user, meeting, note, action_item)
│   │   ├── models/           # SQLAlchemy models (User, Meeting, Transcript, Note, ActionItem)
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── core/             # Database connection & Cloudflare R2 client
│   │   └── utils/            # JWT authentication & password validation
│   ├── main.py               # FastAPI app entry point & CORS configuration
│   └── requirements.txt
├── client/                   # Next.js web dashboard
│   ├── app/                  # App Router pages (login, register, dashboard, meetings/[id])
│   ├── components/           # UI components
│   └── lib/                  # Auth context & API client
├── extension/                # Chrome Extension Manifest V3
│   ├── manifest.json         # Extension permissions & background scripts
│   ├── background.js         # Service worker for meeting state & upload coordination
│   ├── offscreen.html        # Offscreen document host
│   ├── offscreen.js          # Tab audio capture via MediaRecorder & AudioContext pass-through
│   ├── content.js            # Google Meet session detection script
│   ├── popup.html            # Extension popup UI
│   └── popup.js              # Authentication & extension status controller
├── AGENTS.md                 # Developer & AI assistant guidelines
└── README.md
```

---

## How It Works

1. **Detection**: `content.js` monitors DOM elements to detect when a Google Meet call begins.
2. **Audio Capture**: On call completion, `background.js` obtains a tab stream ID and spawns `offscreen.html`. `offscreen.js` uses `MediaRecorder` to capture tab audio into a `.webm` file while piping audio to speakers so call audio is unaffected.
3. **Upload**: `background.js` automatically uploads the WebM audio blob to the backend API (`/meetings/{id}/upload-audio`).
4. **Storage**: Backend streams the audio file to Cloudflare R2.
5. **Transcription**: Groq Whisper (`whisper-large-v3`) transcribes the meeting audio into raw text and timestamped segments.
6. **AI Summarization**: Gemini 3.6 Flash analyzes the transcript and outputs structured JSON containing key decisions, discussion points, blockers, next steps, and action items.
7. **Dashboard**: Notes, action items, and timestamped transcripts are accessible on the Next.js web dashboard.

---

## API Endpoints

### Auth

| Method | Endpoint        | Description             |
|:-------|:----------------|:------------------------|
| POST   | `/users/`       | Register a new user     |
| POST   | `/users/login`  | Login and receive JWT   |

### Meetings

| Method | Endpoint                                    | Description                                |
|:-------|:--------------------------------------------|:-------------------------------------------|
| GET    | `/meetings/`                                | List user meetings                         |
| POST   | `/meetings/`                                | Create a new meeting instance              |
| GET    | `/meetings/{id}`                            | Get meeting metadata by ID                 |
| DELETE | `/meetings/{id}`                            | Delete meeting and related data            |
| POST   | `/meetings/{id}/upload-audio`               | Upload audio blob (.webm / .wav)           |
| GET    | `/meetings/{id}/transcript`                 | Retrieve meeting transcript & segments     |
| POST   | `/meetings/{id}/transcribe`                 | Run Whisper transcription on uploaded audio|
| POST   | `/meetings/{id}/summarize`                  | Run Gemini AI summarization on transcript  |
| GET    | `/meetings/{id}/notes`                      | Get generated meeting notes                |
| GET    | `/meetings/{id}/action-items`               | Get extracted action items                 |
| PATCH  | `/meetings/{id}/action-items/{item_id}`     | Update action item status                  |

---

## Local Development Setup

### Prerequisites

- **Python**: 3.11+
- **Node.js**: 18+

### 1. Backend Setup

```bash
cd server
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # Configure your environment variables
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
cd client
npm install
npm run dev                # Starts Next.js dashboard on http://localhost:3000
```

### 3. Extension Setup

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** in the top right corner.
3. Click **Load unpacked** and select the `extension/` directory.
4. Click the Minute AI extension icon and log in with your credentials.

---

## Environment Variables

Create a `.env` file in `server/` with the following variables:

```env
# Auth
JWT_SECRET_KEY=your_random_jwt_secret_key

# AI Services
GROQ_API_KEY=gsk_your_groq_api_key
GEMINI_API_KEY=AIzaSy_your_gemini_api_key

# Cloudflare R2 Storage
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=minuteai

# Production Database (Optional for local SQLite dev)
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

Create a `.env.local` file in `client/` if needed:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Deployment Guide

- **Frontend Dashboard**: Deployed on **Vercel** (`client/`).
- **Backend API**: Deployed as a Web Service on **Render.com** (`server/`).
  - **Root Directory**: `server`
  - **Build Command**: `pip install -r requirements.txt`
  - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

---

## Project Status

- ✅ User authentication with JWT & bcrypt password validation
- ✅ Chrome Extension tab capture via `chrome.offscreen` & `MediaRecorder`
- ✅ Cloudflare R2 audio file storage
- ✅ FFmpeg Audio Slicing (10-min chunking to bypass Groq Whisper 25MB limits with offset re-stitching)
- ✅ Asynchronous pipeline execution via FastAPI BackgroundTasks
- ✅ Groq Whisper speech-to-text transcription with timestamped segments
- ✅ Google Gemini 3.6 Flash structured JSON summarization
- ✅ Next.js dashboard on Vercel with meeting list, detail view, action item status toggles, and transcript viewer
- ✅ Production deployment architecture (Vercel + Render + Cloudflare R2)


---

## Author

Yash Bhidawe — [itsokyash.online](https://itsokyash.online) · [github.com/yashbhidawe](https://github.com/yashbhidawe)
