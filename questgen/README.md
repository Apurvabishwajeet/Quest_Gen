# QuestGen — AI-Powered Quest Tracker Generator

A website that generates a personalised day-by-day progress tracker using Gemini AI.
Users fill in a form → your server calls Gemini → they get a downloadable gamified tracker.

---

## Project Structure

```
questgen/
├── server.js          ← Node.js backend (hides your API key)
├── package.json       ← Dependencies
├── .env.example       ← Copy this to .env and add your key
├── .gitignore         ← Keeps .env out of git
└── public/
    └── index.html     ← The full frontend (form + tracker)
```

---

## Setup & Run Locally

### Step 1 — Install Node.js
Download from https://nodejs.org (choose LTS version)

### Step 2 — Install dependencies
```bash
cd questgen
npm install
```

### Step 3 — Add your Gemini API key
```bash
cp .env.example .env
```
Open `.env` and replace `your_gemini_api_key_here` with your actual key from https://aistudio.google.com

### Step 4 — Run the server
```bash
npm start
```
Open http://localhost:3000 in your browser. Done!

---

## Deploy to Render (free hosting)

1. Push this folder to a GitHub repo
2. Go to https://render.com → New → Web Service
3. Connect your GitHub repo
4. Set these:
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. Add environment variable: `GEMINI_API_KEY` = your key
6. Click Deploy → you get a live URL like `https://questgen.onrender.com`

---

## Deploy to Railway (alternative, also free)

1. Go to https://railway.app → New Project → Deploy from GitHub
2. Connect your repo
3. Add environment variable: `GEMINI_API_KEY` = your key
4. Deploy → live in 2 minutes

---

## How it works

1. User fills the form (goal, duration, focus, style)
2. Frontend sends data to `/api/generate` on YOUR server
3. Your server calls Gemini API using your hidden key
4. Gemini returns a JSON plan
5. Frontend builds the tracker and offers download
6. User gets a standalone HTML tracker file

Your API key is never exposed to the user.

---

## Environment Variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Your Gemini API key from aistudio.google.com |
| `PORT` | Server port (default: 3000, auto-set on Render/Railway) |
