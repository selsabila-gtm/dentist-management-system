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

      if (!res.ok || !data.success) {
        alert(data.message || "Invalid username or password.");
        return;
      }

      // success → go to staff dashboard
      navigate("/staff");
    } catch (err) {
      console.error(err);
      alert("Could not connect to server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
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
