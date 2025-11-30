// src/components/staffLayout.jsx
import React from "react";
import "../styles/staff.css";

export default function StaffLayout({ children }) {
  return (
    <div className="staff-layout">

      {/* Right: page content */}
      <main className="staff-content">{children}</main>
    </div>
  );
}
