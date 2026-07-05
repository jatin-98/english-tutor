import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home";
import History from "./pages/History";
import Analytics from "./pages/Analytics";
import Diagnosis from "./pages/Diagnosis";
import Settings from "./pages/Settings";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app-shell">
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
          <div className="shortcut-hint">
            <span>Press <kbd>⌘⇧G</kbd> anywhere</span>
          </div>
        </nav>
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

export default App;
