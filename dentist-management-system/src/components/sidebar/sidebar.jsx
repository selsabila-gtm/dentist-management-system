import { NavLink } from "react-router-dom";
import "./sidebar.css";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="avatar" />
        <div className="app-name">DentalPro</div>
      </div>

      <nav className="sidebar-menu">
        <NavLink to="/" className="sidebar-item">
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/appointments/calendar"
          className={({ isActive }) =>
            "sidebar-item" + (isActive ? " active" : "")
          }
        >
          <span>Calendar</span>
        </NavLink>

        <div className="sidebar-item">
          <span>Staff</span>
        </div>
        <div className="sidebar-item">
          <span>Patients</span>
        </div>
        <div className="sidebar-item">
          <span>Billing</span>
        </div>
        <div className="sidebar-item">
          <span>Inventory</span>
        </div>
        <div className="sidebar-item">
          <span>Reports</span>
        </div>
      </nav>

      <div className="sidebar-footer">
        <span>⚙ Settings</span>
      </div>
    </aside>
  );
}
