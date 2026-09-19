// ============================================
// src/App.jsx
// ============================================
import { NavLink, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import "./App.css";
export default function App() {
  return (
    <div>
      <nav className="app-nav">
        <span className="brand">Price Watch</span>
        <NavLink
          to="/"
          className={({ isActive }) => (isActive ? "active" : "")}
          end
        >
          Search
        </NavLink>
        <NavLink
          to="/dashboard"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Dashboard
        </NavLink>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/product/:id" element={<ProductDetail />} />
      </Routes>
    </div>
  );
}
