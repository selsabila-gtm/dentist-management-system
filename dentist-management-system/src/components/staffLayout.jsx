// src/components/StaffLayout.jsx
import React from "react";
import { Link, NavLink } from "react-router-dom";
import "../styles/staff.css";

export default function StaffLayout({ children }) {
  return (
    <div className="staff-layout">
      <aside className="staff-sidebar">
        <div className="staff-logo">
          <div className="staff-avatar-circle">DC</div>
          <span className="staff-logo-text">DentalCloud</span>
        </div>

        <nav className="staff-nav">
          <NavLink to="/dashboard" className="staff-nav-item">
            <span>🏠</span>
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/calendar" className="staff-nav-item">
            <span>📅</span>
            <span>Calendar</span>
          </NavLink>
          <NavLink to="/staff" className="staff-nav-item">
            <span>👥</span>
            <span>Staff</span>
          </NavLink>
          <NavLink to="/patients" className="staff-nav-item">
            <span>🧑‍⚕️</span>
            <span>Patients</span>
          </NavLink>
          <NavLink to="/billing" className="staff-nav-item">
            <span>💳</span>
            <span>Billing</span>
          </NavLink>
          <NavLink to="/inventory" className="staff-nav-item">
            <span>📦</span>
            <span>Inventory</span>
          </NavLink>
          <NavLink to="/reports" className="staff-nav-item">
            <span>📊</span>
            <span>Reports</span>
          </NavLink>
        </nav>

        <div className="staff-settings">
          <span>⚙️</span>
          <span>Settings</span>
        </div>
      </aside>

      <main className="staff-content">{children}</main>
    </div>
  );
}
