// src/pages/dashboard/dashboard.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/sidebar/sidebar";
import Notifications from "../../components/notification/notifications";
import "./dashboard.css";

/* runtime-safe API base (Vite / CRA / fallback) */
const API_BASE =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE) ||
  (typeof process !== "undefined" &&
    process.env &&
    process.env.REACT_APP_API_BASE) ||
  "http://127.0.0.1:5000";

/* helpers copied from your Notifications component logic */
const EXPIRY_DAYS = 30;
function parseExpiryToDate(expiryStr) {
  if (!expiryStr) return null;
  const s = String(expiryStr).trim();
  if (s.toLowerCase() === "n/a") return null;
  const isoMatch = /^\d{4}-\d{2}-\d{2}$/.test(s);
  if (isoMatch) return new Date(s + "T00:00:00");
  const mmYYYY = s.match(/^(\d{1,2})[\/-](\d{4})$/);
  if (mmYYYY) {
    const mm = parseInt(mmYYYY[1], 10);
    const yyyy = parseInt(mmYYYY[2], 10);
    return new Date(yyyy, mm, 0, 0, 0, 0);
  }
  const yyyyMM = s.match(/^(\d{4})[\/-](\d{1,2})$/);
  if (yyyyMM) {
    const yyyy = parseInt(yyyyMM[1], 10);
    const mm = parseInt(yyyyMM[2], 10);
    return new Date(yyyy, mm, 0, 0, 0, 0);
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d;
  return null;
}
function daysBetween(from, to) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.ceil((to - from) / msPerDay);
}

function todayKey(date = new Date()) {
  const t = new Date(date);
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    appointments: 0,
    patients: 0,
    staff: 0,
    inventoryLow: 0,
    alerts: 0,
    totalRevenue: 0,
    avgAppointmentCost: 0,
    todayAppointments: [],
    upcomingCount: 0,
    pendingPayments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Get current user from localStorage
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
      setCurrentUser(user);
    } catch (err) {
      console.error("Error reading current user:", err);
      navigate("/login");
    }
  }, [navigate]);

  // read dismissed notifications from localStorage (same key used by Notifications component)
  const getDismissed = () => {
    try {
      return JSON.parse(localStorage.getItem("dismissed_notifications") || "[]");
    } catch {
      return [];
    }
  };

  // safe json reader
  async function safeJson(res) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  const fetchStats = useCallback(async () => {
    if (!currentUser || !currentUser.id) return;

    setLoading(true);
    try {
      const userRole = (currentUser.role_name || "").toLowerCase();
      const isDentist = userRole === "dentist";
      const isAdmin = userRole === "admin";
      const userId = currentUser.id;

      // Build appointments URL with dentist filter if needed
      const appointmentsUrl = isDentist 
        ? `${API_BASE}/api/appointments?dentist_id=${userId}`
        : `${API_BASE}/api/appointments`;

      // fetch main resources in parallel
      const fetchPromises = [
        fetch(appointmentsUrl),
        fetch(`${API_BASE}/api/patients`),
        fetch(`${API_BASE}/api/inventory`),
        fetch(`${API_BASE}/api/invoices`),
      ];

      // Only fetch staff if admin
      if (isAdmin) {
        fetchPromises.push(fetch(`${API_BASE}/api/staff`));
      }

      const settled = await Promise.allSettled(fetchPromises);

      // helpers to extract results
      const extract = async (index) => {
        if (!settled[index] || settled[index].status !== "fulfilled") return null;
        const res = settled[index].value;
        if (!res || !res.ok) return null;
        return safeJson(res);
      };

      const appointments = (await extract(0)) || [];
      const allPatients = (await extract(1)) || [];
      const inventory = (await extract(2)) || [];
      const invoices = (await extract(3)) || [];
      const staff = isAdmin ? ((await extract(4)) || []) : [];

      // For dentists, filter patients to only those who have appointments with them
      let patients = allPatients;
      if (isDentist) {
        const patientIds = new Set(
          appointments
            .filter(a => a.patient_id)
            .map(a => a.patient_id)
        );
        patients = allPatients.filter(p => patientIds.has(p.id));
      }

      // compute low stock and expiry notifications (same logic as Notifications component)
      const now = new Date();
      const dismissList = getDismissed();
      const notifs = [];

      for (const it of inventory || []) {
        const qty = Number(it.quantity || 0);
        const minStock = Number(it.minimum_stock || 0);
        if (!isNaN(qty) && !isNaN(minStock) && qty <= minStock) {
          const id = `low-${it.id}`;
          if (!dismissList.includes(id)) {
            notifs.push({
              id,
              type: "Low stock",
              itemId: it.id,
              itemName: it.item_name,
              quantity: qty,
              minimum_stock: minStock,
              expiry: it.expiration_date || "N/A",
              daysLeft: null,
              created_at: now.toISOString(),
            });
          }
        }

        const expDate = parseExpiryToDate(it.expiration_date);
        if (expDate) {
          const daysLeft = daysBetween(now, expDate);
          if (daysLeft <= EXPIRY_DAYS) {
            const id = `exp-${it.id}-${String(it.expiration_date)}`;
            if (!dismissList.includes(id)) {
              notifs.push({
                id,
                type: daysLeft < 0 ? "Expired" : "Expiring soon",
                itemId: it.id,
                itemName: it.item_name,
                quantity: Number(it.quantity || 0),
                minimum_stock: it.minimum_stock,
                expiry: it.expiration_date,
                daysLeft,
                created_at: now.toISOString(),
              });
            }
          }
        }
      }

      // filter only today's appointments
      const today = todayKey();
      const todayAppointments = Array.isArray(appointments)
        ? appointments.filter((a) => String(a.date) === today)
        : [];

      // ✅ Calculate revenue ONLY from today's COMPLETED appointments
      let totalRevenue = 0;
      let completedTodayCount = 0;
      
      for (const a of todayAppointments) {
        if (String(a.status).toLowerCase() === "completed") {
          const c = parseFloat(a.cost);
          if (!Number.isNaN(c)) {
            totalRevenue += c;
            completedTodayCount++;
          }
        }
      }
      
      // ✅ Average = today's revenue / today's completed appointments
      const avgAppointmentCost = completedTodayCount > 0 
        ? totalRevenue / completedTodayCount 
        : 0;

      // Count upcoming (scheduled) appointments for today
      const upcomingCount = todayAppointments.filter(
        (a) => String(a.status).toLowerCase() === "scheduled"
      ).length;





      
      // ✅ Calculate pending payments by summing each patient's outstanding balance
      // Outstanding per patient = (completed appointment costs) - (invoices paid for that patient)
      // Then sum all patient outstandings for dentist's patients (or all patients if admin)
      
      const patientBilling = {};
      
      // Step 1: Identify relevant patients
      const relevantPatientIds = new Set();
      
      if (isDentist) {
        // Dentist: only patients from their appointments
        for (const appt of appointments) {
          if (appt.patient_id) {
            relevantPatientIds.add(appt.patient_id);
          }
        }
      } else {
        // Admin: all patients from all appointments
        const allAppointments = await safeJson(await fetch(`${API_BASE}/api/appointments`));
        if (allAppointments) {
          for (const appt of allAppointments) {
            if (appt.patient_id) {
              relevantPatientIds.add(appt.patient_id);
            }
          }
        }
      }
      
      // Step 2: Calculate total COMPLETED appointment costs per patient
      const allAppointmentsForBilling = isDentist ? appointments : (await safeJson(await fetch(`${API_BASE}/api/appointments`))) || [];
      
      for (const appt of allAppointmentsForBilling) {
        const patientId = appt.patient_id;
        if (!patientId || !relevantPatientIds.has(patientId)) continue;
        
        // Only count COMPLETED appointments
        if (String(appt.status).toLowerCase() !== "completed") continue;
        
        const cost = parseFloat(appt.cost) || 0;
        if (!patientBilling[patientId]) {
          patientBilling[patientId] = { totalCost: 0, totalPaid: 0 };
        }
        patientBilling[patientId].totalCost += cost;
      }
      
      // Step 3: Calculate total invoice payments per patient
      for (const inv of invoices) {
        const patientId = inv.patient_id;
        if (!patientId || !relevantPatientIds.has(patientId)) continue;
        
        const amount = parseFloat(inv.amount) || 0;
        if (!patientBilling[patientId]) {
          patientBilling[patientId] = { totalCost: 0, totalPaid: 0 };
        }
        patientBilling[patientId].totalPaid += amount;
      }
      
      // Step 4: Calculate outstanding per patient, then sum all outstandings
      let totalPending = 0;
      for (const patientId in patientBilling) {
        const { totalCost, totalPaid } = patientBilling[patientId];
        const patientOutstanding = Math.max(totalCost - totalPaid, 0);
        totalPending += patientOutstanding;
      }

      setStats({
        appointments: Array.isArray(appointments) ? appointments.length : 0,
        patients: Array.isArray(patients) ? patients.length : 0,
        staff: Array.isArray(staff) ? staff.length : 0,
        inventoryLow: inventory ? inventory.filter((it) => Number(it.quantity) <= Number(it.minimum_stock)).length : 0,
        alerts: notifs.length,
        totalRevenue,
        avgAppointmentCost,
        todayAppointments,
        upcomingCount,
        pendingPayments: totalPending,
      });
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    fetchStats();

    // optional: refresh every 5 minutes
    const id = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchStats, currentUser]);

  const username = currentUser?.username || localStorage.getItem("username") || "User";
  const role = currentUser?.role_name || localStorage.getItem("role") || "";
  const isAdmin = (currentUser?.role_name || "").toLowerCase() === "admin";
  const isDentist = (currentUser?.role_name || "").toLowerCase() === "dentist";

  // ✅ Format currency in DA (Algerian Dinar)
  const fmtCurrency = (v) =>
    v === 0 ? "0 DA" : v ? `${Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })} DA` : "—";
  const fmtNumber = (v) => (v === 0 ? "0" : v ? Number(v).toLocaleString() : "—");

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <div className="page">
          <header className="page-header">
            <div>
              <h1 className="page-title">Dashboard</h1>
              <p className="dashboard-subtitle">
                Welcome back, <strong>{username}</strong> {role && <span className="muted">({role})</span>}
              </p>
            </div>
          </header>

          <section className="dashboard-top">
            <div className="appointments-card card">
              <div className="card-header">
                <h3>Today's Appointments{isDentist && " (Your Schedule)"}</h3>
                <button className="link-button" onClick={() => navigate("/calendar")}>View Calendar</button>
              </div>

              <table className="appt-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Patient</th>
                    <th>Procedure</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", padding: 14 }}>Loading…</td>
                    </tr>
                  ) : stats.todayAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", padding: 14 }}>No appointments today.</td>
                    </tr>
                  ) : (
                    stats.todayAppointments
                      .sort((a, b) => {
                        // sort by time if available (HH:MM or HH:MM AM/PM)
                        const tA = String(a.time || "");
                        const tB = String(b.time || "");
                        return tA.localeCompare(tB, undefined, { numeric: true, sensitivity: "base" });
                      })
                      .map((appt) => (
                        <tr key={appt.id}>
                          <td>{appt.time}</td>
                          <td>{appt.patient}</td>
                          <td>{appt.procedure}</td>
                          <td>
                            <span className={`status-pill status-${appt.status}`}>
                              {appt.status}
                            </span>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="overview-cards">
              <div className="overview-grid">
                <div className="overview-card card" onClick={() => navigate("/patients")}>
                  <div className="overview-title">{isDentist ? "Your Patients" : "Total Patients"}</div>
                  <div className="overview-value">{loading ? "—" : fmtNumber(stats.patients)}</div>
                </div>

                <div className="overview-card card" onClick={() => navigate("/invoices")}>
                  <div className="overview-title">Pending Payments / Bills</div>
                  <div className="overview-value">{loading ? "—" : fmtCurrency(stats.pendingPayments)}</div>
                </div>

                <div className="overview-card card" onClick={() => navigate("/calendar")}>
                  <div className="overview-title">Upcoming Appointments</div>
                  <div className="overview-value">{loading ? "—" : fmtNumber(stats.upcomingCount)}</div>
                </div>

                <div className="overview-card card" onClick={() => navigate("/notifications")}>
                  <div className="overview-title">Alerts</div>
                  <div className="overview-value">{loading ? "—" : fmtNumber(stats.alerts)}</div>
                </div>
              </div>

              <div className="kpis">
                <div className="kpi-card card">
                  <div className="kpi-header">
                    <div>
                      <div className="kpi-title">{isDentist ? "Today's Revenue" : "Today's Revenue"}</div>
                      <div className="kpi-value">{loading ? "—" : fmtCurrency(stats.totalRevenue)}</div>
                      <div className="kpi-sub">From completed appointments today</div>
                    </div>
                    <div className="kpi-chart">
                      <svg viewBox="0 0 120 40" className="mini-line">
                        <polyline fill="none" strokeWidth="2" points="0,30 15,20 30,25 45,18 60,22 75,28 90,12 105,20 120,10" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="kpi-card card">
                  <div className="kpi-header">
                    <div>
                      <div className="kpi-title">Avg Appointment Cost</div>
                      <div className="kpi-value">{loading ? "—" : fmtCurrency(stats.avgAppointmentCost)}</div>
                      <div className="kpi-sub">Today's completed appointments</div>
                    </div>
                    <div className="kpi-chart small-bars">
                      <svg viewBox="0 0 100 40" className="mini-bars">
                        <rect x="6" y="8" width="8" height="32" />
                        <rect x="22" y="12" width="8" height="28" />
                        <rect x="38" y="6" width="8" height="34" />
                        <rect x="54" y="10" width="8" height="30" />
                        <rect x="70" y="8" width="8" height="32" />
                        <rect x="86" y="12" width="8" height="28" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="quick-actions card">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <button onClick={() => navigate("/calendar/add")} className="action-button">➕ New Appointment</button>
              {!isDentist && (
                <button onClick={() => navigate("/patients/add")} className="action-button">👤 Add Patient</button>
              )}
              {isAdmin && (
                <button onClick={() => navigate("/inventory/add")} className="action-button">📦 Add Inventory</button>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}