import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import profileImg from "../../assets/images/profile_img.png";
import {
  FiHome,
  FiCalendar,
  FiUsers,
  FiUser,
  FiDollarSign,
  FiBox,
  FiBarChart2,
  FiSettings,
  FiMenu,
  FiX
} from "react-icons/fi";
import "./Sidebar.css";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    // Get user role from localStorage
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const role = (currentUser.role_name || "").toLowerCase();
      setUserRole(role);
    } catch (err) {
      console.error("Error reading user role:", err);
    }
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  // Check if user has access to certain features
  const isAdmin = userRole === "admin";

  // Admin sees everything
  // Staff and Reports are admin-only
  const canSeeReports = isAdmin;
  const canSeeStaff = isAdmin;

  return (
    <>
      {/* Hamburger button for mobile */}
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        <FiMenu size={24} />
      </button>

      {/* Overlay for mobile */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'show' : ''}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Close button for mobile */}
        <button className="sidebar-close" onClick={closeSidebar}>
          <FiX />
        </button>

        {/* Logo & User */}
        <div className="sidebar-header">
          <img src={profileImg} alt="User" className="profile-img" />
          <h3 className="app-title">DentalCloud</h3>
        </div>

        {/* Menu */}
        <nav className="sidebar-menu">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => (isActive ? "menu-item active" : "menu-item")}
            onClick={closeSidebar}
          >
            <FiHome className="icon" /> Dashboard
          </NavLink>

          <NavLink
            to="/calendar"
            className={({ isActive }) => (isActive ? "menu-item active" : "menu-item")}
            onClick={closeSidebar}
          >
            <FiCalendar className="icon" /> Calendar
          </NavLink>

          {/* Staff - Admin only */}
          {canSeeStaff && (
            <NavLink
              to="/staff"
              className={({ isActive }) => (isActive ? "menu-item active" : "menu-item")}
              onClick={closeSidebar}
            >
              <FiUsers className="icon" /> Staff
            </NavLink>
          )}

          <NavLink
            to="/patients"
            className={({ isActive }) => (isActive ? "menu-item active" : "menu-item")}
            onClick={closeSidebar}
          >
            <FiUser className="icon" /> Patients
          </NavLink>

          <NavLink
            to="/billing"
            className={({ isActive }) => (isActive ? "menu-item active" : "menu-item")}
            onClick={closeSidebar}
          >
            <FiDollarSign className="icon" /> Billing
          </NavLink>

          {/* Inventory - Now visible to all users */}
          <NavLink
            to="/inventory"
            className={({ isActive }) => (isActive ? "menu-item active" : "menu-item")}
            onClick={closeSidebar}
          >
            <FiBox className="icon" /> Inventory
          </NavLink>

          {/* Reports - Admin only */}
          {canSeeReports && (
            <NavLink
              to="/reports"
              className={({ isActive }) => (isActive ? "menu-item active" : "menu-item")}
              onClick={closeSidebar}
            >
              <FiBarChart2 className="icon" /> Reports
            </NavLink>
          )}
        </nav>

        {/* Settings at bottom */}
        <div className="sidebar-footer">
          <NavLink
            to="/settings"
            className={({ isActive }) => (isActive ? "menu-item active" : "menu-item")}
            onClick={closeSidebar}
          >
            <FiSettings className="icon" /> Settings
          </NavLink>
        </div>
      </div>
    </>
  );
};

export default Sidebar;