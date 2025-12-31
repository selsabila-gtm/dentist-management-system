// src/pages/staff/changePassword.jsx
import { useState, useEffect } from "react";
import { updateStaff } from "../../services/staffApi";
import { useNavigate } from "react-router-dom";
import StaffAdminLayout from "../../components/StaffAdminLayout";
import Sidebar from "../../components/Sidebar/Sidebar";
import "../../styles/staff.css";

const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem("currentUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

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

  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // toast
  const [toast, setToast] = useState({
    visible: false,
    type: "success",
    message: "",
  });

  const showToast = (message, type = "success") => {
    setToast({ visible: true, type, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  // ✅ Check admin
  useEffect(() => {
    const user = getCurrentUser();
    if (!user || !user.is_admin) {
      setIsAdmin(false);
      showToast("You don't have permission to change staff passwords.", "error");
    } else {
      setIsAdmin(true);
    }
    setAuthChecked(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      showToast("Password must be at least 8 characters.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }

    try {
      setSaving(true);
      await updateStaff(staffId, { password: newPassword });
      showToast("Password updated successfully");
      setTimeout(() => {
        navigate(`/staff/${staffId}`);
      }, 400);
    } catch (err) {
      console.error(err);
      showToast("Failed to update password", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = () => {
    if (!resetEmail || !/^\S+@\S+\.\S+$/.test(resetEmail)) {
      showToast("Please enter a valid email", "error");
      return;
    }

    // 🔵 You can add your backend reset endpoint here:
    // await sendResetEmail(resetEmail);

    showToast("Password reset link sent to " + resetEmail);
    setShowResetModal(false);
  };

  // ⏳ waiting auth
  if (!authChecked) {
    return (
      <div className="app-layout">
        <Sidebar />
      <StaffAdminLayout>
        <div className="staff-main">
          <p>Loading...</p>
        </div>
      </StaffAdminLayout>
      </div>
    );
  }

  // 🚫 not admin
  if (!isAdmin) {
    return (
      <div className="app-layout">
      <Sidebar />
      <StaffAdminLayout>
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

        <div className="staff-main">
          <div className="staff-card">
            <h1 className="staff-page-title" style={{ fontSize: 22 }}>
              Access denied
            </h1>
            <p style={{ marginTop: 8, color: "#6b7280", fontSize: 14 }}>
              You do not have permission to change staff passwords.
            </p>
            <button
              type="button"
              className="btn-secondary"
              style={{ marginTop: 16 }}
              onClick={() => navigate("/")}
            >
              Go back
            </button>
          </div>
        </div>
      </StaffAdminLayout>
      </div>
    );
  }

  // ✅ admin UI (original)
  return (
    <div className="app-layout">
      <Sidebar />
    <StaffAdminLayout>
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

        <div
          style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}
        >
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
    </StaffAdminLayout>
    </div>
  );
}
