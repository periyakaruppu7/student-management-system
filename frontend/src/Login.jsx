
import { useState } from "react";
import { Link } from "react-router-dom";
import {
    signInWithPopup,
    signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import "./Login.css";

function Login({ onLogin }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await signInWithEmailAndPassword(
                auth,
                email.trim(),
                password
            );

            if (onLogin) {
                await onLogin(result.user);
            }
        } catch (err) {
            console.error("Email login error:", err);
            setError("Unable to sign in. Check your credentials and try again.");
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogleLogin() {
        setError("");
        setLoading(true);

        try {
            const result = await signInWithPopup(auth, googleProvider);

            if (onLogin) {
                await onLogin(result.user);
            }
        } catch (err) {
            console.error("Google login error:", err);

            if (err.code === "auth/popup-closed-by-user") {
                setError("Google sign-in was cancelled.");
            } else if (err.code === "auth/popup-blocked") {
                setError("Your browser blocked the Google sign-in popup.");
            } else {
                setError("Google sign-in failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-page">
            <div className="login-background-shape shape-one" />
            <div className="login-background-shape shape-two" />

            <div className="container login-container">
                <div className="row justify-content-center align-items-center">
                    <div className="col-12 col-sm-10 col-md-8 col-lg-5 col-xl-5">
                        <div className="login-card card border-0">
                            <div className="card-body">
                                <div className="login-logo">
                                    <i className="bi bi-mortarboard-fill" />
                                </div>

                                <div className="text-center login-heading">
                                    <span className="login-eyebrow">
                                        STUDENT MANAGEMENT SYSTEM
                                    </span>

                                    <h1>Welcome Back</h1>

                                    <p>
                                        Sign in to access your management dashboard.
                                    </p>
                                </div>

                                {error && (
                                    <div className="alert alert-danger login-error" role="alert">
                                        <i className="bi bi-exclamation-circle-fill me-2" />
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div className="mb-4">
                                        <label htmlFor="email" className="form-label">
                                            Email Address
                                        </label>

                                        <div className="login-input-group">
                                            <i className="bi bi-envelope input-icon" />

                                            <input
                                                id="email"
                                                type="email"
                                                className="form-control login-input"
                                                placeholder="name@example.com"
                                                value={email}
                                                onChange={(event) => setEmail(event.target.value)}
                                                autoComplete="username"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="password" className="form-label">
                                            Password
                                        </label>

                                        <div className="login-input-group">
                                            <i className="bi bi-lock input-icon" />

                                            <input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                className="form-control login-input password-input"
                                                placeholder="Enter your password"
                                                value={password}
                                                onChange={(event) => setPassword(event.target.value)}
                                                autoComplete="current-password"
                                                required
                                            />

                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() =>
                                                    setShowPassword((previous) => !previous)
                                                }
                                                aria-label={
                                                    showPassword ? "Hide password" : "Show password"
                                                }
                                            >
                                                <i
                                                    className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"
                                                        }`}
                                                />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="login-options">
                                        <label className="remember-label">
                                            <input
                                                type="checkbox"
                                                checked={rememberMe}
                                                onChange={(event) =>
                                                    setRememberMe(event.target.checked)
                                                }
                                            />
                                            <span>Remember me</span>
                                        </label>

                                        <span className="login-help-text">
                                            <i className="bi bi-shield-check me-1" />
                                            Secure sign in
                                        </span>
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn login-submit w-100"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span
                                                    className="spinner-border spinner-border-sm"
                                                    aria-hidden="true"
                                                />
                                                <span>Signing in...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Sign In</span>
                                                <i className="bi bi-arrow-right" />
                                            </>
                                        )}
                                    </button>
                                </form>

                                <div className="login-or-divider">
                                    <span>OR CONTINUE WITH</span>
                                </div>

                                <button
                                    type="button"
                                    className="btn google-login-btn w-100"
                                    onClick={handleGoogleLogin}
                                    disabled={loading}
                                >
                                    <i className="bi bi-google me-2" />
                                    Continue with Google
                                </button>

                                <div className="login-divider">
                                    <span />
                                    <i className="bi bi-shield-lock" />
                                    <span />
                                </div>

                                <p className="login-footer">
                                    Student Management Portal
                                </p>

                                <p className="login-footer">
                                    <Link to="/student-login">
                                        Student and learning portal sign in
                                    </Link>
                                </p>

                                <p className="login-copyright">
                                    © {new Date().getFullYear()} All rights reserved.
                                </p>
                            </div>
                        </div>

                        <p className="login-bottom-note">
                            <i className="bi bi-check-circle-fill me-1" />
                            Your learning journey starts here.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
