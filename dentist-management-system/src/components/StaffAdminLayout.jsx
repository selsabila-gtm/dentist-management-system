// src/components/StaffAdminLayout.jsx
import React, { useEffect, useState } from "react";
import "../styles/staff.css";
import { getCurrentUser, isAdminUser } from "../utils/auth";

export default function StaffAdminLayout({ children }) {
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setUser(getCurrentUser());
    setChecked(true);
  }, []);

  // still loading localStorage
  if (!checked) {
    return null;
  }

  // Not logged in
  if (!user) {
    return (
      <div className="staff-layout">
        <main className="staff-content">
          <div className="staff-card">
            <h1 className="staff-page-title">Access denied</h1>
            <p style={{ marginTop: 6, color: "#6b7280", fontSize: 14 }}>
              You must be logged in as an administrator to manage staff.
            </p>
            <button
              className="btn-secondary"
              style={{ marginTop: 16 }}
              onClick={() => (window.location.href = "/login")}
            >
              Go to login
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Logged in but not admin
  if (!isAdminUser(user)) {
    return (
      <div className="staff-layout">
        <main className="staff-content">
          <div className="staff-card">
            <h1 className="staff-page-title">Access denied</h1>
            <p style={{ marginTop: 6, color: "#6b7280", fontSize: 14 }}>
              You do not have permission to manage staff. Please contact an
              administrator if you think this is a mistake.
            </p>
            <button
              className="btn-secondary"
              style={{ marginTop: 16 }}
              onClick={() => window.history.back()}
            >
              Go back
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ✅ Admin – show staff pages
  return (
    <div className="staff-layout">
      <main className="staff-content">{children}</main>
    </div>
  );
}
