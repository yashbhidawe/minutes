# minuteai

Automatic meeting notes for Google Meet. Records tab audio after the call, transcribes via Whisper, and generates structured summaries and action items using Gemini. Notes are stored and accessible via a web dashboard.

---

## Overview

minuteai is a Chrome extension paired with a web dashboard. It captures Google Meet audio without requiring host permissions, processes it through an AI pipeline, and returns clean notes within minutes of the call ending.

Built for small teams and individuals who want meeting context without manual note-taking.

---

## Stack

**Backend** — FastAPI, PostgreSQL, SQLAlchemy, Alembic  
**Frontend** — Next.js, Tailwind CSS, Zustand  
**Extension** — Vanilla JS, Chrome Extensions Manifest V3  
**AI** — OpenAI Whisper (transcription), Google Gemini (summarization)  
**Storage** — Cloudflare R2 (audio), PostgreSQL (notes and metadata)  
**Infra** — Docker, Railway (backend), Vercel (frontend)

---

## Repository Structure

```
minuteai/
├── backend/
│   ├── app/
│   │   ├── api/            # route handlers
│   │   ├── services/       # whisper, gemini, auth logic
│   │   ├── repositories/   # database queries
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── core/           # config, db, constants
│   ├── alembic/
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── store/
│   └── package.json
├── extension/
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   ├── popup/
│   └── utils/
└── docker-compose.yml
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

## Local Development

**Prerequisites:** Python 3.11+, Node 18+, PostgreSQL, Docker (optional)

```bash
# clone the repo
git clone https://github.com/yashbhidawe/minuteai
cd minuteai

# backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn main:app --reload

# frontend
cd ../frontend
npm install
npm run dev   # starts on localhost:3000
```

**Extension:** Go to `chrome://extensions`, enable Developer Mode, click Load Unpacked, and select the `extension/` folder.

---

## Environment Variables

```
DATABASE_URL=
OPENAI_API_KEY=
GEMINI_API_KEY=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
JWT_SECRET=
```

---

## Status

Active development. Not production-ready.

---

## Author

Yash Bhidawe — [itsokyash.online](https://itsokyash.online) · [github.com/yashbhidawe](https://github.com/yashbhidawe)
