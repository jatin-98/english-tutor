import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import Home from "./pages/Home";
import History from "./pages/History";
import Analytics from "./pages/Analytics";
import Diagnosis from "./pages/Diagnosis";
import Settings from "./pages/Settings";
import "./App.css";

function Sidebar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">✍️</span>
        <span className="logo-text">English Tutor</span>
      </div>

      <ul className="nav-links">
        <li><NavLink to="/" end>🏠 Home</NavLink></li>
        <li><NavLink to="/history">📋 History</NavLink></li>
        <li><NavLink to="/analytics">📊 Analytics</NavLink></li>
        <li><NavLink to="/diagnosis">🧠 AI Diagnosis</NavLink></li>
        <li><NavLink to="/settings">⚙️ Settings</NavLink></li>
      </ul>

      <div className="sidebar-footer">
        <div className="theme-toggle">
          <span>{theme === "dark" ? "🌙 Dark" : "☀️ Light"}</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={theme === "light"}
              onChange={toggleTheme}
            />
            <span className="toggle-track" />
            <span className="toggle-thumb" />
          </label>
        </div>
        <div className="shortcut-hint">
          Press <kbd>⌘⇧E</kbd> anywhere
        </div>
      </div>
    </nav>
  );
}

function AppLayout() {
  return (
    <Router>
      <div className="app-shell">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/history" element={<History />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/diagnosis" element={<Diagnosis />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppLayout />
    </ThemeProvider>
  );
}

export default App;
