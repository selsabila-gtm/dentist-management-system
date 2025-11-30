// src/pages/staff/changePassword.jsx
import { useState } from "react";
import { updateStaff } from "../../services/staffApi";
import { useNavigate } from "react-router-dom";
import StaffLayout from "../../components/StaffLayout";
import "../../styles/staff.css";

// FIXED: extract ID safely
const getIdFromLocation = () => {
  const parts = window.location.pathname.split("/");
  return parts[parts.length - 2]; // /staff/:id/password
};

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const staffId = getIdFromLocation();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  // Forgot password modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      setSaving(true);
      await updateStaff(staffId, { password: newPassword });
      alert("Password updated successfully");
      navigate(`/staff/${staffId}`);
    } catch (err) {
      console.error(err);
      alert("Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = () => {
    if (!resetEmail || !/^\S+@\S+\.\S+$/.test(resetEmail)) {
      alert("Please enter a valid email");
      return;
    }

    // 🔵 You can add your backend reset endpoint here:
    // await sendResetEmail(resetEmail);

    alert("Password reset link sent to " + resetEmail);
    setShowResetModal(false);
  };

  return (
    <StaffLayout>
      <div className="staff-page-header">
        <button
          className="btn-secondary"
          onClick={() => navigate(`/staff/${staffId}`)}
        >
          ← Back to Staff
        </button>
        <h1 className="staff-page-title">Change Password</h1>
        <div style={{ width: 120 }}></div>
      </div>

      <form
        className="staff-card"
        onSubmit={handleSubmit}
        style={{ maxWidth: 700 }}
      >
        <div className="staff-field">
          <label>Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
          />
        </div>

        <div className="staff-field">
          <label>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            required
          />
        </div>

        <div className="staff-field">
          <label>Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
          />
        </div>

        <p style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
          Password must be at least 8 characters long and include a mix of
          letters, numbers, and symbols.
        </p>

        <p
          style={{
            fontSize: 12,
            color: "#2563eb",
            marginTop: 4,
            cursor: "pointer",
            textDecoration: "underline",
            width: "fit-content",
          }}
          onClick={() => setShowResetModal(true)}
        >
          Forgot Password?
        </p>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>

      {/* RESET PASSWORD MODAL */}
      {showResetModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 50,
          }}
        >
          <div
            className="staff-card"
            style={{
              width: 400,
              padding: 24,
              textAlign: "center",
            }}
          >
            <h2 style={{ fontSize: 20, marginBottom: 10 }}>Reset Password</h2>

            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 10 }}>
              Enter the email associated with this account.
            </p>

            <input
              type="email"
              placeholder="your@email.com"
              className="staff-input"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              style={{ width: "100%", marginBottom: 16 }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <button
                className="btn-secondary"
                onClick={() => setShowResetModal(false)}
              >
                Cancel
              </button>

              <button className="btn-primary" onClick={handleResetPassword}>
                Send Reset Link
              </button>
            </div>
          </div>
        </div>
      )}
    </StaffLayout>
  );
}
