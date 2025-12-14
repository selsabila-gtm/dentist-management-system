// src/pages/staff/login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../../styles/staff.css";

const API_BASE = "http://localhost:5000/api";

export default function LoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState({
    visible: false,
    type: "success",
    message: "",
  });

  const showToast = (message, type = "error") => {
    setToast({ visible: true, type, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  const validate = () => {
    const newErrors = {};
    if (!username.trim()) newErrors.username = "Username is required.";
    if (!password) newErrors.password = "Password is required.";
    else if (password.length < 8)
      newErrors.password = "Password must be at least 8 characters.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      console.log("LOGIN RESPONSE:", data);

      if (!res.ok || !data.success) {
        showToast(data.message || "Invalid username or password.", "error");
        return;
      }

      // ✅ Find the "real" user object (backend may return it in different keys)
      const rawUser =
        data.user || data.staff || data.employee || data.current_user || null;

      // ✅ Build a normalized user object that auth.js can understand
      const normalizedUser = {
        ...(rawUser || {}),
        // fallbacks if backend returns flat fields
        id: (rawUser && rawUser.id) ?? data.id,
        username: (rawUser && rawUser.username) ?? data.username ?? username,

        // IMPORTANT: normalize role into role_name and role.name
        role_name:
          (rawUser && rawUser.role_name) ??
          (typeof (rawUser && rawUser.role) === "string" ? rawUser.role : null) ??
          data.role_name ??
          (typeof data.role === "string" ? data.role : null) ??
          (data.role && data.role.name ? data.role.name : null),

        role:
          (rawUser && rawUser.role && typeof rawUser.role === "object"
            ? rawUser.role
            : null) ||
          (data.role && typeof data.role === "object" ? data.role : null) ||
          null,

        // keep permissions if backend returns them
        permissions: (rawUser && rawUser.permissions) ?? data.permissions ?? null,
      };

      // ✅ Save logged-in user (used for admin checks in auth.js)
      localStorage.setItem("currentUser", JSON.stringify(normalizedUser));

      // ✅ (optional) if your ProtectedRoute still relies on staff_id
      // keep this so you don’t get stuck on login
      localStorage.setItem("staff_id", String(normalizedUser.id || ""));

      navigate("/staff");
    } catch (err) {
      console.error(err);
      showToast("Could not connect to server.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      {toast.visible && (
        <div className="toast-container">
          <div
            className={`toast ${
              toast.type === "error" ? "toast-error" : "toast-success"
            }`}
          >
            <span className="toast-message">{toast.message}</span>
            <button
              type="button"
              className="toast-close"
              onClick={() => setToast((prev) => ({ ...prev, visible: false }))}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <form className="login-panel" onSubmit={handleSubmit}>
        <h1 className="login-title">Welcome back</h1>

        <div className="staff-field">
          <label>Username</label>
          <input
            className={
              errors.username ? "staff-input staff-input-error" : "staff-input"
            }
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          {errors.username && (
            <p className="staff-error-text">{errors.username}</p>
          )}
        </div>

        <div className="staff-field">
          <label>Password</label>
          <input
            type="password"
            className={
              errors.password ? "staff-input staff-input-error" : "staff-input"
            }
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password && (
            <p className="staff-error-text">{errors.password}</p>
          )}
        </div>

        <div className="login-row">
          <Link to="/reset-password" className="login-link">
            Forgot Password?
          </Link>
        </div>

        <div className="login-row">
          <label className="login-remember">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Remember me
          </label>
        </div>

        <button
          type="submit"
          className="btn-primary login-button"
          disabled={submitting}
        >
          {submitting ? "Logging in..." : "Log In"}
        </button>
      </form>
    </div>
  );
}
