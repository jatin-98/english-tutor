# English Tutor — Desktop App (`app/`)

This is the **Tauri v2** desktop application for English Tutor. It acts as the system-level shell:
registers the global keyboard shortcut, captures selected text via the clipboard, shows the
AI correction popup, and hosts the full analytics dashboard.

---

## Tech Stack

| Layer           | Technology                          |
|-----------------|-------------------------------------|
| UI Framework    | React 18 (TypeScript)               |
| Build Tool      | Vite                                |
| Desktop Shell   | Tauri v2 (Rust)                     |
| Routing         | React Router v6                     |
| Charts          | Recharts                            |
| Styling         | Vanilla CSS (custom design system)  |

---

## Tauri Plugins Used

| Plugin                            | Purpose                                              |
|-----------------------------------|------------------------------------------------------|
| `tauri-plugin-global-shortcut`    | Register `Cmd+Shift+G` / `Ctrl+Shift+G` system-wide |
| `tauri-plugin-clipboard-manager`  | Read selected text from clipboard                    |
| `tauri-plugin-shell`              | Spawn Docker Compose to start backend services       |
| `tauri-plugin-store`              | Persist user settings locally                        |

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+ (via [nvm](https://github.com/nvm-sh/nvm) recommended)
- [Rust](https://rustup.rs/) (latest stable)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for the backend services)

---

## Getting Started

```bash
# From the repo root, install frontend dependencies
cd app
npm install

# Run in development mode (hot reload)
npm run tauri dev

# Build for production
npm run tauri build
```

> The backend services (FastAPI microservices) must be running before the app can make
> API calls. From the **repo root**, run `make up` to start them.

---

## Folder Structure

```
app/
├── src/                        # React frontend
│   ├── App.tsx                 # Root layout with sidebar + React Router
│   ├── App.css                 # Global design system (dark theme, CSS vars)
│   ├── main.tsx                # React entry point
│   ├── pages/
│   │   ├── Home.tsx            # Today's score & recent corrections
│   │   ├── History.tsx         # All checked sentences (searchable)
│   │   ├── Analytics.tsx       # Charts: score trend, mistake breakdown
│   │   ├── Diagnosis.tsx       # AI-generated weekly learning report
│   │   └── Settings.tsx        # Shortcut config, API key, model selection
│   └── components/
│       └── CorrectionPopup.tsx # Floating popup shown after shortcut triggers
│
└── src-tauri/                  # Rust backend (OS-level)
    ├── src/
    │   ├── main.rs             # Binary entry point
    │   └── lib.rs              # Global shortcut, system tray, plugin setup
    ├── Cargo.toml              # Rust dependencies (Tauri plugins)
    └── tauri.conf.json         # App config: name, window size, tray, identifier
```

---

## How the Global Shortcut Works

1. User selects text in **any app** (Slack, Word, browser, Notepad, etc.)
2. User presses `Cmd+Shift+G` (macOS) or `Ctrl+Shift+G` (Windows)
3. `lib.rs` intercepts the shortcut via `tauri-plugin-global-shortcut`
4. A `shortcut-triggered` event is emitted to the React frontend
5. The frontend simulates `Cmd+C` / `Ctrl+C` to copy the selected text
6. Clipboard content is read via `tauri-plugin-clipboard-manager`
7. Text is sent to the API Gateway (`localhost:8000/correct`)
8. The AI correction result is shown in the `CorrectionPopup` window

---

## Keyboard Shortcut

| OS      | Shortcut          |
|---------|-------------------|
| macOS   | `Cmd + Shift + G` |
| Windows | `Ctrl + Shift + G`|

The shortcut can be changed in the **Settings** page.

---

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/)
- [Tauri Extension](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

---

## API Gateway

All backend calls go through `http://localhost:8000`. The base URL is configurable in Settings.

| Endpoint                 | Description                     |
|--------------------------|---------------------------------|
| `POST /correct`          | Submit text for AI correction   |
| `GET  /history`          | Fetch all checked sentences     |
| `GET  /analytics`        | Get stats and chart data        |
| `GET  /diagnosis/latest` | Get the latest AI diagnosis     |

---

> For the full project architecture and stack details, see [STACK.md](../STACK.md) in the repo root.
