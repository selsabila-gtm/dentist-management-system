// src/pages/staff/resetPassword.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/staff.css";

const API_BASE = "http://localhost:5000/api";

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

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

    if (!email.trim()) newErrors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Please enter a valid email.";

    if (!newPassword) newErrors.newPassword = "New password is required.";
    else if (newPassword.length < 8)
      newErrors.newPassword = "Password must be at least 8 characters.";

    if (confirmPassword !== newPassword)
      newErrors.confirmPassword = "Passwords do not match.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);

    try {
      const res = await fetch(`${API_BASE}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, new_password: newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Failed to reset password.", "error");
        return;
      }

      showToast(data.message || "Password updated.");
      setTimeout(() => {
        navigate("/login");
      }, 500);
    } catch (err) {
      console.error(err);
      showToast("Could not connect to server.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="login-page">
      {/* Toast */}
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
              onClick={() =>
                setToast((prev) => ({ ...prev, visible: false }))
              }
            >
              ×
            </button>
          </div>
        </div>
      )}

      <form className="login-panel" onSubmit={handleReset}>
        <h1 className="login-title">Reset Password</h1>

        <div className="staff-field">
          <label>Email</label>
          <input
            className={
              errors.email ? "staff-input staff-input-error" : "staff-input"
            }
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email && (
            <p className="staff-error-text">{errors.email}</p>
          )}
        </div>

        <div className="staff-field">
          <label>New Password</label>
          <input
            type="password"
            className={
              errors.newPassword
                ? "staff-input staff-input-error"
                : "staff-input"
            }
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          {errors.newPassword && (
            <p className="staff-error-text">{errors.newPassword}</p>
          )}
        </div>

        <div className="staff-field">
          <label>Confirm New Password</label>
          <input
            type="password"
            className={
              errors.confirmPassword
                ? "staff-input staff-input-error"
                : "staff-input"
            }
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {errors.confirmPassword && (
            <p className="staff-error-text">{errors.confirmPassword}</p>
          )}
        </div>

        <p style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
          Password must be at least 8 characters long and include a mix of
          letters, numbers, and symbols.
        </p>

        <div className="login-row" style={{ marginTop: 16 }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate("/login")}
          >
            ← Back to Login
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Resetting..." : "Reset Password"}
          </button>
        </div>
      </form>
    </div>
  );
}
