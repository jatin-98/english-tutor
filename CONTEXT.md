# Project Context — AI English Writing Assistant

> **Purpose of this file:** This is a living context document. If the AI assistant loses memory,
> share this file to restore full project context instantly. It captures every decision made,
> every pivot taken, and the reasoning behind each choice.

---

## Who is this for?

**User:** Jatin — intermediate English speaker. Does not struggle with reading/writing basics,
but wants to improve the quality, grammar, and fluency of written English used daily
in tools like Slack, email, Facebook, LinkedIn, etc.

---

## What This Project Is

An AI-powered writing assistant that:
1. Runs silently in the background on a desktop computer
2. Lets the user select any text in **any application** and press a keyboard shortcut
3. The selected text is analyzed by an AI model for grammar, tone, and phrasing
4. A popup appears with the mistake details, corrected version, and alternatives
5. Every checked sentence is stored locally for long-term pattern analysis
6. A built-in dashboard shows progress over time, common mistakes, and an AI diagnosis

---

## Decision History (Pivots & Why)

### ❌ Rejected: Voice/Speaking App
**What was suggested first:** A speaking tutor with STT (Whisper), TTS (ElevenLabs), and
real-time conversation practice.
**Why rejected:** User clarified they don't need speaking practice — they want help with
*written* English used in real daily tools (Slack, email, etc.)

---

### ❌ Rejected: Browser Extension + Web Dashboard
**What was suggested second:** A Chrome/Firefox browser extension to capture selected text,
with a separate Next.js web dashboard.
**Why rejected:** User did not want a browser extension. They want something that works
across ALL apps — including desktop apps like Slack desktop, Outlook, Word — not just
browser tabs.

---

### ❌ Rejected: macOS-only Native App
**What was suggested third:** A macOS menu bar app using Swift/SwiftUI or Python with pynput/rumps.
**Why rejected:** User wants cross-platform support — both **macOS and Windows**.

---

### ❌ Rejected: Standalone Web App (No Extension)
**What was considered:** A pure web app with no system-level integration.
**Why rejected:** A web app alone cannot intercept text from other apps or register global
keyboard shortcuts system-wide. It has no access to what the user is typing in Slack or Word.

---

### ✅ Final Decision: Tauri Desktop App + Python Microservices

**Tauri** was chosen as the desktop shell because:
- Cross-platform: works on macOS AND Windows (and Linux)
- Small app size: ~5–10 MB (uses OS native webview, no bundled Chromium like Electron)
- Can register **global keyboard shortcuts** system-wide
- Can **simulate Ctrl+C / Cmd+C** to read selected text from any app via clipboard
- Can run as a **system tray** app (silent background operation)
- Can **spawn Docker Compose** to manage the backend microservices
- React (TypeScript) is used for the UI inside Tauri

**Python FastAPI** was chosen over Node.js because:
- Native access to AI/ML libraries (openai, anthropic, langchain)
- Native data analysis with pandas/numpy for mistake pattern analysis
- All major AI SDKs support Python first
- Auto-generated Swagger docs at /docs
- Clean typed code with Pydantic models

**Microservices architecture** was chosen because:
- Each responsibility is independently runnable and updatable
- Clear separation of concerns
- Services can be individually tested
- Docker Compose orchestrates all services locally

**SQLite** was chosen over PostgreSQL because:
- No server needed — just a local file
- Perfect for single-user desktop apps
- Everything stays private on the user's machine
- Easy to back up

---

## Final Approved Stack

| Layer              | Technology                          |
|--------------------|-------------------------------------|
| Desktop Shell      | Tauri v2 (Rust + React/TypeScript)  |
| UI Framework       | React (TypeScript)                  |
| Charts             | Recharts                            |
| Styling            | Vanilla CSS                         |
| Backend Services   | Python FastAPI (x5 microservices)   |
| AI Provider        | OpenAI GPT-4o / Claude Sonnet (TBD) |
| Database           | SQLite via SQLAlchemy + Alembic     |
| Message Broker     | Redis (for async Diagnosis jobs)    |
| Orchestration      | Docker Compose                      |

---

## Microservices Overview

All services run locally on the user's machine via Docker Compose.
Tauri communicates only with the API Gateway.

| Service            | Port | Responsibility                                      |
|--------------------|------|-----------------------------------------------------|
| API Gateway        | 8000 | Single entry point for Tauri, routes all requests   |
| Correction Service | 8001 | Calls OpenAI/Claude, returns grammar corrections    |
| Storage Service    | 8002 | All DB reads/writes (SQLite) — source of truth      |
| Analytics Service  | 8003 | Pandas-based stats and chart data                   |
| Diagnosis Service  | 8004 | Async LLM meta-analysis via Redis queue             |
| Redis              | 6379 | Job queue for async diagnosis generation            |

---

## How Text Capture Works

1. User selects text in any app (Slack, Word, browser, Notepad, etc.)
2. User presses `Ctrl+Shift+G` (or a custom shortcut configured in Settings)
3. Tauri intercepts the global shortcut (works even when app is minimized)
4. Tauri simulates `Ctrl+C` (Windows) / `Cmd+C` (macOS) programmatically
5. Tauri reads the clipboard content
6. Sends `POST /correct` to API Gateway on localhost:8000
7. Gateway routes to Correction Service (port 8001)
8. Correction Service calls OpenAI/Claude, then saves result via Storage Service
9. Correction result is returned to Tauri
10. Tauri shows a small frameless popup window with the correction details

---

## Dashboard Pages (inside Tauri)

- **Home** — today's score, recent corrections
- **History** — all checked sentences, searchable and filterable
- **Analytics** — mistake type breakdown (charts), score over time, streaks
- **AI Diagnosis** — weekly LLM-generated pattern analysis and learning plan
- **Settings** — shortcut key config, AI model selection, API key input

---

## Repo Structure

```
english-tutor/                       ← GitHub repo root
│
├── app/                             # Tauri desktop application
│   ├── src/                         # React frontend
│   ├── src-tauri/                   # Rust backend (OS-level)
│   ├── package.json
│   ├── vite.config.ts
│   └── index.html
│
├── services/                        # All microservices
│   ├── gateway/                     # port 8000
│   ├── correction/                  # port 8001
│   ├── storage/                     # port 8002
│   ├── analytics/                   # port 8003
│   └── diagnosis/                   # port 8004
│
├── .github/workflows/               # CI/CD (future)
├── docker-compose.yml
├── docker-compose.dev.yml
├── Makefile
├── .env.example
├── .gitignore
├── README.md
├── STACK.md                         # Detailed technical stack doc
└── CONTEXT.md                       # This file
```

**Key rule:** Root contains only project-wide files. Tauri files live in `app/`, not the root.

---

## Tauri Responsibilities

| Responsibility         | Tauri Plugin / API                    |
|------------------------|---------------------------------------|
| Global keyboard shortcut | `tauri-plugin-global-shortcut`      |
| Clipboard read/write   | `tauri-plugin-clipboard-manager`      |
| System tray icon       | `tauri-plugin-tray`                   |
| Frameless popup window | Tauri window API                      |
| Launch Docker Compose  | `tauri-plugin-shell`                  |
| Store settings locally | `tauri-plugin-store`                  |
| React UI host          | Built-in OS webview                   |

---

## AI Response Schema (Correction Service)

```json
{
  "original": "I was went to market yesterday",
  "is_correct": false,
  "mistakes": [
    {
      "error": "was went",
      "type": "tense",
      "explanation": "Double past tense used incorrectly.",
      "fix": "went"
    },
    {
      "error": "market",
      "type": "article",
      "explanation": "Missing definite article before a specific place.",
      "fix": "the market"
    }
  ],
  "corrected": "I went to the market yesterday.",
  "alternatives": [
    "Yesterday, I visited the market.",
    "I had gone to the market yesterday."
  ],
  "tone": "casual",
  "score": 58
}
```

---

## Current Project State

- [x] Stack decided
- [x] Architecture designed (microservices)
- [x] Repo initialized (`git init` done)
- [x] STACK.md created with full technical details
- [x] CONTEXT.md created (this file)
- [ ] GitHub remote created and pushed
- [ ] .gitignore created
- [ ] README.md created
- [ ] Makefile created
- [ ] docker-compose.yml created
- [ ] Any service code written

---

## Open Questions (Still to Research)

- [ ] OpenAI GPT-4o vs Anthropic Claude Sonnet — which gives better grammar feedback?
- [ ] `arq` vs `celery` for Redis job queue — which is simpler for this scale?
- [ ] Does Docker need to be pre-installed, or should we bundle services differently?
- [ ] How should Tauri handle the case where Docker is not installed?
- [ ] Should the API key be stored in OS keychain (secure) or a local `.env` file?
- [ ] Inter-service communication: pure HTTP vs gRPC — is gRPC worth the complexity?
- [ ] SQLite in a Docker container — how to persist the DB file across container restarts?
- [ ] Windows: Does simulating `Ctrl+C` to capture selected text work reliably in all apps?
