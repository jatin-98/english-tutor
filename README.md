# ✍️ English Tutor

> An AI-powered writing assistant that lives in your system tray and helps you write better English — in any app, anywhere.

---

## What It Does

Select any text you've typed — in Slack, Outlook, Word, a browser, or anywhere else — press a keyboard shortcut, and instantly get:

- ✅ Grammar and spelling corrections
- 💡 Better phrasing alternatives
- 📊 A score for your writing quality
- 🧠 Long-term pattern analysis to show you where you're improving

No copy-pasting into a website. No switching apps. Just press the shortcut and a popup appears.

---

## Features

- **Global Shortcut** — works in every app on your system, not just the browser
- **Instant Popup** — shows mistakes, fixes, and alternatives right where you're working
- **History** — every sentence you check is saved locally
- **Analytics Dashboard** — see your score trend, most common mistakes, and streaks
- **AI Diagnosis** — weekly LLM-generated report on your patterns and a personal learning plan
- **100% Local** — all data stays on your machine, nothing sent to the cloud except the AI API call

---

## Tech Stack (Summary)

| Layer | Technology |
|---|---|
| Desktop App | Tauri v2 (Rust + React) |
| Backend | Python FastAPI (microservices) |
| AI | OpenAI GPT-4o / Claude Sonnet |
| Database | SQLite (local) |
| Orchestration | Docker Compose |

> For full technical details, architecture diagrams, and service breakdown → see [STACK.md](./STACK.md)

---

## Prerequisites

Make sure you have the following installed before getting started:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — to run the backend services
- [Rust](https://rustup.rs/) — required by Tauri
- [Node.js](https://nodejs.org/) (v18+) — for the React frontend
- An API key from [OpenAI](https://platform.openai.com/) or [Anthropic](https://www.anthropic.com/)

---

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/english-tutor.git
cd english-tutor

# 2. Set up environment variables
cp .env.example .env
# Edit .env and add your API key

# 3. Start all backend services
make up

# 4. Run the desktop app (in a separate terminal)
cd app
npm install
npm run tauri dev
```

The app will appear in your system tray. Press `Ctrl+Shift+G` (or `Cmd+Shift+G` on macOS) after selecting any text to start.

---

## Project Structure

```
english-tutor/
├── app/              # Tauri desktop app (React + Rust)
├── services/
│   ├── gateway/      # API Gateway (port 8000)
│   ├── correction/   # AI grammar analysis (port 8001)
│   ├── storage/      # Database service (port 8002)
│   ├── analytics/    # Stats & charts (port 8003)
│   └── diagnosis/    # Weekly AI diagnosis (port 8004)
├── docker-compose.yml
├── Makefile
└── STACK.md          # Full technical documentation
```

---

## Useful Commands

```bash
make up        # Start all backend services
make down      # Stop all services
make logs      # Stream logs from all services
make restart   # Restart all services
```

---

## Configuration

Copy `.env.example` to `.env` and fill in your values:

```bash
OPENAI_API_KEY=your_key_here
# or
ANTHROPIC_API_KEY=your_key_here
```

> ⚠️ Never commit your `.env` file. It is listed in `.gitignore`.

---

## Documentation

| File | Contents |
|---|---|
| [STACK.md](./STACK.md) | Full architecture, service breakdown, libraries, AI schema |
| [CONTEXT.md](./CONTEXT.md) | Project decisions, pivots, and reasoning log |

---

## Status

🚧 **Currently in planning / early development.**
