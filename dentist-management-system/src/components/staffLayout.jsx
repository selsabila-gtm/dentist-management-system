// src/components/staffLayout.jsx
import React from "react";
import Sidebar from "./sidebar/sidebar"; // adjust path if different
import "../styles/staff.css";

export default function StaffLayout({ children }) {
  return (
    <div className="staff-layout">
      {/* Left: shared app sidebar */}
      <Sidebar />

      {/* Right: page content */}
      <main className="staff-content">{children}</main>
    </div>
  );
}
