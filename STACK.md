# AI English Writing Assistant — Stack & Architecture

## Project Overview

A cross-platform native desktop app (macOS + Windows) that helps improve English writing skills.
- Press a global shortcut in **any app** — Slack, Outlook, Word, browser, anything
- Selected text is captured and sent to an AI model for grammar correction and suggestions
- All checked sentences are stored locally for analysis
- A built-in dashboard shows progress, common mistakes, and AI-generated diagnosis

---

## Architecture Style: Microservices

Each responsibility is a **separate, independently runnable service**.
All services run locally on the user's machine via **Docker Compose**.
The Tauri desktop app communicates only with the **API Gateway**.

```
[Any App — Slack, Outlook, Word, Browser, etc.]
        ↓ (select text + Ctrl+Shift+G)
[Tauri Desktop App]
        ↓ simulates Ctrl+C / Cmd+C → reads clipboard
        ↓ HTTP request
┌─────────────────────────────────┐
│         API Gateway :8000       │  ← Single entry point for Tauri
└─────────────────────────────────┘
        ↓            ↓            ↓            ↓
  Correction      Storage      Analytics    Diagnosis
  Service         Service      Service      Service
  :8001           :8002        :8003        :8004
        ↓            ↓            ↓            ↓
  OpenAI/     SQLite DB      pandas /     OpenAI/Claude
  Claude                     numpy        (batch LLM call)
        ↓
  Redis (async job queue for Diagnosis Service)
```

---

## Services

### 1. API Gateway — `:8000`
**Role:** Single entry point. Routes requests from Tauri to the correct microservice.

| Property       | Detail                          |
|----------------|---------------------------------|
| Framework      | **FastAPI**                     |
| Responsibility | Request routing, auth, rate limiting |
| Communicates   | With all internal services via HTTP |
| Exposed to     | Tauri desktop app only (localhost) |

**Routes it exposes to Tauri:**
```
POST /correct          → Correction Service
GET  /history          → Storage Service
GET  /analytics        → Analytics Service
GET  /diagnosis        → Diagnosis Service
POST /diagnosis/trigger → Diagnosis Service (async)
```

---

### 2. Correction Service — `:8001`
**Role:** Receives raw text, calls the AI model, returns grammar corrections.

| Property       | Detail                          |
|----------------|---------------------------------|
| Framework      | **FastAPI**                     |
| AI Provider    | OpenAI GPT-4o / Claude Sonnet   |
| After analysis | Calls Storage Service to save result |
| Libraries      | `openai`, `anthropic`, `pydantic` |

**Flow:**
```
Receives text → Calls OpenAI/Claude → Parses structured response
→ POSTs result to Storage Service → Returns correction to Gateway
```

---

### 3. Storage Service — `:8002`
**Role:** The single source of truth. All data reads/writes go through here.

| Property       | Detail                          |
|----------------|---------------------------------|
| Framework      | **FastAPI**                     |
| Database       | **SQLite** (via SQLAlchemy)     |
| Migration tool | **Alembic**                     |
| Libraries      | `sqlalchemy`, `alembic`         |

**Endpoints:**
```
POST /sentences          → Save a new correction
GET  /sentences          → List all (with filters)
GET  /sentences/:id      → Get one
GET  /mistakes/summary   → Aggregated mistake counts
```

**Key Tables:**
```sql
sentences
  id, original_text, corrected_text, mistakes (JSON),
  score (int), timestamp, source_app

diagnoses
  id, generated_at, summary_text, top_issues (JSON)
```

---

### 4. Analytics Service — `:8003`
**Role:** Processes stored data to generate statistics and charts data.

| Property       | Detail                          |
|----------------|---------------------------------|
| Framework      | **FastAPI**                     |
| Libraries      | `pandas`, `numpy`               |
| Data source    | Calls Storage Service           |

**Endpoints:**
```
GET /analytics/score-over-time     → Daily/weekly score trend
GET /analytics/mistake-breakdown   → Count by mistake type
GET /analytics/top-errors          → Most frequent errors
GET /analytics/streaks             → Days active, improvement streaks
```

---

### 5. Diagnosis Service — `:8004`
**Role:** Runs periodic deep analysis using LLM over accumulated mistakes.

| Property       | Detail                          |
|----------------|---------------------------------|
| Framework      | **FastAPI**                     |
| AI Provider    | OpenAI GPT-4o / Claude Sonnet   |
| Async jobs     | **Redis** (job queue)           |
| Libraries      | `openai`, `redis`, `pandas`     |

**Flow:**
```
Trigger received → Fetch all mistakes from Storage Service
→ Build meta-analysis prompt → Call LLM → Save diagnosis
→ Storage Service stores result → Tauri notifies user
```

**Endpoints:**
```
POST /diagnosis/trigger   → Queue a new diagnosis job (async)
GET  /diagnosis/latest    → Get most recent diagnosis
GET  /diagnosis/history   → All past diagnoses
```

---

### 6. Redis (Message Broker)
**Role:** Async job queue between API Gateway and Diagnosis Service.

| Property   | Detail                             |
|------------|------------------------------------|
| Use case   | Diagnosis generation (can take 5–10s) |
| Library    | `redis-py` + `celery` OR `arq`     |
| Run via    | Docker Compose                     |

> Diagnosis is intentionally async — it's a heavy LLM call over large data.
> Tauri gets notified via polling or a webhook when it's ready.

---

## Desktop Shell — Tauri

| Component         | Technology                              |
|-------------------|-----------------------------------------|
| Framework         | **Tauri v2** (Rust + Web frontend)      |
| UI                | **React (TypeScript)**                  |
| Global Shortcut   | Tauri `globalShortcut` plugin           |
| Text Capture      | Simulate `Ctrl+C` / `Cmd+C` → clipboard |
| System Tray       | Tauri `tray` plugin                     |
| Popup Window      | Tauri secondary window (frameless)      |
| App Size          | ~5–10 MB (uses OS native webview)       |
| Cross-platform    | ✅ macOS + Windows                      |
| Starts services   | Tauri spawns Docker Compose on launch   |

---

## Dashboard UI — React (inside Tauri)

| Component  | Technology             |
|------------|------------------------|
| Framework  | **React (TypeScript)** |
| Charts     | **Recharts**           |
| Styling    | Vanilla CSS            |
| Routing    | React Router           |

**Pages:**
- **Home** — today's score, recent corrections
- **History** — all checked sentences, searchable
- **Analytics** — charts from Analytics Service
- **AI Diagnosis** — latest LLM diagnosis report
- **Settings** — shortcut config, API key, model preference

---

## Orchestration — Docker Compose

All microservices run via a single `docker-compose.yml`:

```yaml
services:
  gateway:       # port 8000
  correction:    # port 8001
  storage:       # port 8002
  analytics:     # port 8003
  diagnosis:     # port 8004
  redis:         # port 6379
```

Tauri starts Docker Compose as a subprocess on app launch and stops it on exit.

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

## How Text Capture Works

```
1. User selects text in any app (Slack, Word, browser, etc.)
2. User presses Ctrl+Shift+G (or custom shortcut)
3. Tauri intercepts the global shortcut
4. Tauri simulates Ctrl+C (Win) / Cmd+C (macOS) programmatically
5. Tauri reads clipboard content
6. Sends POST /correct to API Gateway (port 8000)
7. Gateway routes to Correction Service
8. Correction Service calls AI, saves via Storage Service
9. Result returned to Tauri
10. Tauri shows frameless popup with corrections
```

---

## Project Folder Structure

```
english-tutor/                       ← repo root (GitHub)
│
├── app/                             # Tauri desktop application
│   ├── src/                         # React frontend
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── History.tsx
│   │   │   ├── Analytics.tsx
│   │   │   ├── Diagnosis.tsx
│   │   │   └── Settings.tsx
│   │   ├── components/
│   │   │   └── CorrectionPopup.tsx
│   │   └── styles/
│   ├── src-tauri/                   # Rust backend (OS-level)
│   │   ├── src/main.rs              # Global shortcut, clipboard, tray, spawn Docker
│   │   └── tauri.conf.json
│   ├── package.json
│   ├── vite.config.ts
│   └── index.html
│
├── services/                        # All microservices
│   ├── gateway/                     # API Gateway — port 8000
│   │   ├── main.py
│   │   └── Dockerfile
│   │
│   ├── correction/                  # Correction Service — port 8001
│   │   ├── main.py
│   │   ├── services/ai.py           # OpenAI / Claude calls
│   │   └── Dockerfile
│   │
│   ├── storage/                     # Storage Service — port 8002
│   │   ├── main.py
│   │   ├── models/
│   │   ├── db/database.py
│   │   ├── english_tutor.db         # SQLite file (gitignored)
│   │   └── Dockerfile
│   │
│   ├── analytics/                   # Analytics Service — port 8003
│   │   ├── main.py
│   │   ├── services/analytics.py    # Pandas analysis
│   │   └── Dockerfile
│   │
│   └── diagnosis/                   # Diagnosis Service — port 8004
│       ├── main.py
│       ├── services/ai.py           # LLM meta-analysis
│       ├── worker.py                # Redis job worker
│       └── Dockerfile
│
├── .github/
│   └── workflows/                   # CI/CD (future)
│
├── docker-compose.yml               # Starts all services together
├── docker-compose.dev.yml           # Dev overrides (hot reload)
├── Makefile                         # Shortcuts: make up, make down, make logs
├── .env.example                     # Env variable template (no secrets)
├── .gitignore
├── README.md
└── STACK.md
```

---

## Key Libraries Per Service

| Service    | Libraries                                        |
|------------|--------------------------------------------------|
| Gateway    | `fastapi`, `httpx`, `uvicorn`                    |
| Correction | `fastapi`, `openai`, `anthropic`, `httpx`        |
| Storage    | `fastapi`, `sqlalchemy`, `alembic`, `pydantic`   |
| Analytics  | `fastapi`, `pandas`, `numpy`, `httpx`            |
| Diagnosis  | `fastapi`, `openai`, `redis`, `arq`, `pandas`    |

---

## Open Questions for Research

- [ ] OpenAI GPT-4o vs Anthropic Claude Sonnet — which gives better grammar feedback?
- [ ] `arq` vs `celery` for Redis job queue — which is simpler for this scale?
- [ ] Does Docker need to be pre-installed by the user, or should we bundle services differently?
- [ ] How should Tauri handle the case where Docker is not installed on the user's machine?
- [ ] Should the API key be stored in OS keychain (secure) or a local `.env` file?
- [ ] Inter-service communication: pure HTTP (simple) vs gRPC (faster but complex) — worth it?
- [ ] SQLite lives in the Storage Service container — how to persist the DB file across container restarts?
