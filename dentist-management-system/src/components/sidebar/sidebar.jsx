import React from "react";
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
  FiSettings
} from "react-icons/fi";
import "./Sidebar.css";

const Sidebar = () => {
  return (
    <div className="sidebar">
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
        >
          <FiHome className="icon" /> Dashboard
        </NavLink>




        <NavLink
          to="/calendar"
          className={({ isActive }) => (isActive ? "menu-item active" : "menu-item")}
        >
          <FiCalendar className="icon" /> Calendar
        </NavLink>






        <NavLink
          to="/staff"
          className={({ isActive }) => (isActive ? "menu-item active" : "menu-item")}
        >
          <FiUsers className="icon" /> Staff
        </NavLink>

        <NavLink
          to="/patients"
          className={({ isActive }) => (isActive ? "menu-item active" : "menu-item")}
        >
          <FiUser className="icon" /> Patients
        </NavLink>

        <NavLink
          to="/billing"
          className={({ isActive }) => (isActive ? "menu-item active" : "menu-item")}
        >
          <FiDollarSign className="icon" /> Billing
        </NavLink>

        <NavLink
          to="/inventory"
          className={({ isActive }) => (isActive ? "menu-item active" : "menu-item")}
        >
          <FiBox className="icon" /> Inventory
        </NavLink>

        <NavLink
          to="/reports"
          className={({ isActive }) => (isActive ? "menu-item active" : "menu-item")}
        >
          <FiBarChart2 className="icon" /> Reports
        </NavLink>
      </nav>

      {/* Settings at bottom */}
      <div className="sidebar-footer">
        <NavLink
          to="/settings"
          className={({ isActive }) => (isActive ? "menu-item active" : "menu-item")}
        >
          <FiSettings className="icon" /> Settings
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
