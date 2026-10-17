import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Navbar.css";

export default function Navbar({ onLogout, adminName = "Administrator" }) {
  const [expanded, setExpanded] = useState(false);

  const closeMenu = () => setExpanded(false);

  const navClass = ({ isActive }) =>
    `school-nav-link ${isActive ? "active" : ""}`;

  function handleLogout() {
    closeMenu();
    onLogout?.();
  }

  return (
    <nav className="school-navbar navbar navbar-expand-lg">
      <div className="container-fluid px-3 px-lg-4">
        {/* Brand */}
        <Link
          className="school-brand"
          to="/"
          onClick={closeMenu}
          aria-label="StudentHub dashboard"
        >
          <span className="school-brand-icon" aria-hidden="true">
            <i className="bi bi-mortarboard-fill" />
          </span>

          <span className="school-brand-text">
            <strong>StudentHub</strong>
            <small>Student management</small>
          </span>
        </Link>

        {/* Mobile menu toggle */}
        <button
          className="navbar-toggler school-toggler"
          type="button"
          aria-label={expanded ? "Close navigation" : "Open navigation"}
          aria-expanded={expanded}
          onClick={() => setExpanded((previous) => !previous)}
        >
          <i className={`bi ${expanded ? "bi-x-lg" : "bi-list"}`} />
        </button>

        {/* Navigation */}
        <div className={`collapse navbar-collapse ${expanded ? "show" : ""}`}>
          <div className="navbar-nav school-nav-links ms-lg-4">
            <NavLink end to="/" className={navClass} onClick={closeMenu}>
              <i className="bi bi-grid-1x2" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink to="/students" className={navClass} onClick={closeMenu}>
              <i className="bi bi-people" />
              <span>Students</span>
            </NavLink>
          </div>

          <div className="school-nav-actions ms-lg-auto">
            {/* <Link
              to="/students/add"
              className="btn school-add-btn"
              onClick={closeMenu}
            >
              <i className="bi bi-plus-lg" />
              <span>Add student</span>
            </Link> */}

            <div className="school-nav-divider" />

            <div className="school-admin">
              <div className="school-admin-avatar" aria-hidden="true">
                {adminName.trim().charAt(0).toUpperCase() || "A"}
              </div>

              <div className="school-admin-info">
                <strong>{adminName}</strong>
                <small>Admin</small>
              </div>
            </div>

            <button
              type="button"
              className="btn school-logout-btn"
              onClick={handleLogout}
              disabled={!onLogout}
              title="Log out"
              aria-label="Log out"
            >
              <i className="bi bi-box-arrow-right" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}