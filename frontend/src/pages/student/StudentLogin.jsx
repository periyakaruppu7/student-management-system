import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../api/auth";
import "../../styles/student-portal.css";

export default function StudentLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);

      navigate(
        result.user.role === "admin"
          ? "/admin/learning"
          : "/student",
        { replace: true }
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to sign in. Check your credentials."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="portal-login-page">
      <form
        className="portal-login-card"
        onSubmit={handleSubmit}
      >
        <div className="portal-login-logo">S</div>

        <p className="portal-eyebrow">
          LEARNING MANAGEMENT SYSTEM
        </p>

        <h1>Welcome back</h1>

        <p className="portal-muted">
          Sign in to access your courses and study resources.
        </p>

        {error && (
          <div className="alert alert-danger py-2 small">
            {error}
          </div>
        )}

        <label className="form-label" htmlFor="email">
          Email address
        </label>

        <input
          id="email"
          className="form-control"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label className="form-label mt-3" htmlFor="password">
          Password
        </label>

        <input
          id="password"
          className="form-control"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          required
        />

        <button
          className="btn btn-primary w-100 mt-4"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="portal-login-note">
          Student accounts are created by the administrator.
        </p>
      </form>
    </div>
  );
}