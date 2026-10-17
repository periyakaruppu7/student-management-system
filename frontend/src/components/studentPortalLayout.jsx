import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import { getStoredUser, logout } from "../api/auth";

export default function StudentPortalLayout() {
  const user = getStoredUser();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/student-login", { replace: true });
  }

  return (
    <div className="portal-shell">
      <aside className="portal-sidebar">
        <div className="portal-brand">
          <span className="portal-brand-mark">S</span>
          <span>Student Portal</span>
        </div>

        <div className="portal-user">
          <div className="portal-avatar">
            {(user?.name || "S").slice(0, 1).toUpperCase()}
          </div>

          <div className="min-w-0">
            <strong>{user?.name || "Student"}</strong>
            <small>{user?.email}</small>
          </div>
        </div>

        <nav className="portal-nav">
          <NavLink end to="/student">
            Dashboard
          </NavLink>

          <NavLink to="/student/courses">
            My Courses
          </NavLink>

          <NavLink to="/student/materials">
            Study Materials
          </NavLink>

          <NavLink to="/student/announcements">
            Announcements
          </NavLink>
        </nav>

        <button
          className="portal-logout"
          onClick={handleLogout}
        >
          Sign out
        </button>
      </aside>

      <main className="portal-main">
        <Outlet />
      </main>
    </div>
  );
}