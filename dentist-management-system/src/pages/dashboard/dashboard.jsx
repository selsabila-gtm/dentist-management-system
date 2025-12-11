// src/pages/dashboard/dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import "./dashboard.css";

const API_BASE = "http://127.0.0.1:5000";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    appointments: 0,
    patients: 0,
    staff: 0,
    inventoryLow: 0,
  });

  useEffect(() => {
    // Check if user is logged in
    const staffId = localStorage.getItem("staff_id");
    if (!staffId) {
      navigate("/login");
      return;
    }

    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch appointments
      const appointmentsRes = await fetch(`${API_BASE}/api/appointments`);
      const appointments = await appointmentsRes.json();

      // Fetch patients
      const patientsRes = await fetch(`${API_BASE}/api/patients`);
      const patients = await patientsRes.json();

      // Fetch staff
      const staffRes = await fetch(`${API_BASE}/api/staff`);
      const staff = await staffRes.json();

      // Fetch inventory
      const inventoryRes = await fetch(`${API_BASE}/api/inventory`);
      const inventory = await inventoryRes.json();
      const lowStock = inventory.filter(
        (item) => item.quantity <= item.minimum_stock
      );

      setStats({
        appointments: appointments.length,
        patients: patients.length,
        staff: staff.length,
        inventoryLow: lowStock.length,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const username = localStorage.getItem("username") || "User";
  const role = localStorage.getItem("role") || "";

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <div className="page">
          <header className="page-header">
            <div>
              <h1>Dashboard</h1>
              <p className="dashboard-subtitle">
                Welcome back, {username} {role && `(${role})`}
              </p>
            </div>
          </header>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card" onClick={() => navigate("/calendar")}>
              <div className="stat-icon appointments-icon">📅</div>
              <div className="stat-content">
                <div className="stat-value">{stats.appointments}</div>
                <div className="stat-label">Total Appointments</div>
              </div>
            </div>

            <div className="stat-card" onClick={() => navigate("/patients")}>
              <div className="stat-icon patients-icon">👥</div>
              <div className="stat-content">
                <div className="stat-value">{stats.patients}</div>
                <div className="stat-label">Patients</div>
              </div>
            </div>

            <div className="stat-card" onClick={() => navigate("/staff")}>
              <div className="stat-icon staff-icon">👨‍⚕️</div>
              <div className="stat-content">
                <div className="stat-value">{stats.staff}</div>
                <div className="stat-label">Staff Members</div>
              </div>
            </div>

            <div className="stat-card" onClick={() => navigate("/inventory")}>
              <div className="stat-icon inventory-icon">📦</div>
              <div className="stat-content">
                <div className="stat-value">{stats.inventoryLow}</div>
                <div className="stat-label">Low Stock Items</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <h2>Quick Actions</h2>
            <div className="action-buttons">
              <button
                className="action-button"
                onClick={() => navigate("/calendar/add")}
              >
                <span className="action-icon">➕</span>
                New Appointment
              </button>
              <button
                className="action-button"
                onClick={() => navigate("/patients/add")}
              >
                <span className="action-icon">👤</span>
                Add Patient
              </button>
              <button
                className="action-button"
                onClick={() => navigate("/inventory/add")}
              >
                <span className="action-icon">📦</span>
                Add Inventory
              </button>
              <button
                className="action-button"
                onClick={() => navigate("/reports")}
              >
                <span className="action-icon">📊</span>
                View Reports
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}