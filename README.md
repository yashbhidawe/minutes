# minuteai

Automatic meeting notes for Google Meet. Records tab audio after the call, transcribes via Whisper, and generates structured summaries and action items using Gemini. Notes are stored and accessible via a web dashboard.

---

## Overview

minuteai is a Chrome extension paired with a web dashboard. It captures Google Meet audio without requiring host permissions, processes it through an AI pipeline, and returns clean notes within minutes of the call ending.

Built for small teams and individuals who want meeting context without manual note-taking.

---

## Stack

**Backend** — FastAPI, SQLite, SQLAlchemy  
**Frontend** — Next.js, Tailwind CSS  
**Extension** — Vanilla JS, Chrome Extensions Manifest V3  
**AI** — OpenAI Whisper (transcription), Google Gemini (summarization)  
**Storage** — Cloudflare R2 (audio files)  
**Auth** — JWT (python-jose), bcrypt (passlib)

---

## Repository Structure

```
minuteai/
├── server/
│   ├── app/
│   │   ├── api/              # route handlers (users, meetings)
│   │   ├── services/         # business logic (user, audio, storage)
│   │   ├── repositories/     # database queries (user, meeting)
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── core/             # config, db connection, R2 client
│   │   └── utils/            # auth, password validation
│   ├── main.py
│   └── requirements.txt
├── client/                   # Next.js dashboard (in progress)
└── README.md
```

---

## How It Works

1. Extension detects an active Google Meet session
2. On call end, tab audio is captured via `chrome.tabCapture`
3. Audio file is uploaded to the backend
4. Backend stores the file in R2 and queues a processing job
5. Whisper transcribes the audio
6. Gemini generates a summary and extracts action items
7. Notes are saved to the database and surfaced on the dashboard

---

## API Endpoints

### Auth

| Method | Endpoint           | Description              |
|:-------|:-------------------|:-------------------------|
| POST   | `/users/`          | Register a new user      |
| POST   | `/users/login`     | Login and get JWT token  |

### Meetings

| Method | Endpoint                        | Description                    |
|:-------|:--------------------------------|:-------------------------------|
| POST   | `/meetings/`                    | Create a new meeting           |
| POST   | `/meetings/{id}/upload-audio`   | Upload audio file for a meeting|

---

## Local Development

**Prerequisites:** Python 3.11+, Node 18+

```bash
# clone the repo
git clone https://github.com/yashbhidawe/minuteai
cd minuteai

# backend
cd server
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload

# frontend
cd ../client
npm install
npm run dev   # starts on localhost:3000
```

---

## Environment Variables

```
# Database
DATABASE_URL=

# Auth
JWT_SECRET_KEY=

# AI
OPENAI_API_KEY=
GEMINI_API_KEY=

# Cloudflare R2 (audio storage)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
```

---

## Status

**Completed:**
- User registration and login with JWT
- Meeting model with status tracking
- Audio upload endpoint with R2 storage

**In Progress:**
- Whisper transcription service
- Gemini summarization and action item extraction

**Planned:**
- Web dashboard (Next.js)
- Chrome extension
- Background job queue

---

## Author

Yash Bhidawe — [itsokyash.online](https://itsokyash.online) · [github.com/yashbhidawe](https://github.com/yashbhidawe)
