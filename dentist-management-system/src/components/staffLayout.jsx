// src/components/staffLayout.jsx
import React from "react";
import "../styles/staff.css";

export default function StaffLayout({ children }) {
  return (
    <div className="staff-layout">
      <main className="staff-content">{children}</main>
    </div>
  );
}
