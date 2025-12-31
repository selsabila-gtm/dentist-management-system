// src/pages/reports/reports.jsx
import React, { useEffect, useState } from "react";
import "../../styles/staff.css";
import "./reports.css";
import {
  fetchInvoices,
  fetchPatientBillingSummary,
} from "../../services/billingApi";
import { getCurrentUser, isAdminUser } from "../../utils/auth";
import Sidebar from "../../components/sidebar/sidebar";

const API_BASE = "http://localhost:5000";

const RANGE_DAYS = {
  week: 7,
  month: 30,
  quarter: 90,
  year: 365,
};

const RANGE_LABELS = {
  week: "Last 7 days",
  month: "Last Month",
  quarter: "Last 3 Months",
  year: "Last Year",
};

function formatCurrency(v) {
  const num = Number(v || 0);
  return `$${num.toFixed(2)}`;
}

function filterInvoicesByRange(invoices, rangeKey) {
  const days = RANGE_DAYS[rangeKey] || 30;
  const now = new Date();
  const from = new Date();
  from.setDate(now.getDate() - days);

  return invoices.filter((inv) => {
    if (!inv.date) return false;
    const d = new Date(inv.date);
    if (Number.isNaN(d.getTime())) return false;

    // Allow future invoices, just make sure they’re not older than the range
    return d >= from;
  });
}

// ----- helpers to fetch basic data -----
async function fetchAllPatients() {
  const res = await fetch(`${API_BASE}/api/patients`);
  if (!res.ok) throw new Error("Failed to load patients");
  return res.json();
}

async function fetchAllAppointments() {
  const res = await fetch(`${API_BASE}/api/appointments`);
  if (!res.ok) throw new Error("Failed to load appointments");
  return res.json();
}

// Load all staff then keep only dentists
async function fetchDentists() {
  const res = await fetch(`${API_BASE}/api/staff`);
  if (!res.ok) throw new Error("Failed to load staff");

  const staff = await res.json();

  const dentistStaff = staff.filter(
    (s) =>
      s.role_name === "Dentist" ||
      (s.role && (s.role.name === "Dentist" || s.role.Name === "Dentist"))
  );

  return dentistStaff.map((s) => ({
    id: s.id,
    name:
      s.full_name ||
      s.name ||
      `${s.first_name || ""} ${s.last_name || ""}`.trim() ||
      `Staff #${s.id}`,
  }));
}

// ----- helper to trigger a CSV download -----
function downloadCsv(csvText, filename) {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

// ---------- MAIN PAGE COMPONENT ----------

export default function ReportsPage() {
  // 🔐 auth state
  const [user, setUser] = useState(null);
  const [checkedUser, setCheckedUser] = useState(false);

  const [activeTab, setActiveTab] = useState("billing"); // 'billing' | 'inventory'
  const [dateRange, setDateRange] = useState("month");
  const [selectedDoctorId, setSelectedDoctorId] = useState("all");

  const [loading, setLoading] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [error, setError] = useState("");

  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [patientSummaries, setPatientSummaries] = useState({}); // { patientId: summary }

  const [billingStats, setBillingStats] = useState(null);
  const [inventoryReport, setInventoryReport] = useState(null);

  // ----- read current user once -----
  useEffect(() => {
    const u = getCurrentUser();
    setUser(u);
    setCheckedUser(true);
  }, []);

  // ----- Load base data (only for admins) -----
  useEffect(() => {
    if (!checkedUser || !isAdminUser(user)) return;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const [inv, pats, appts, docs] = await Promise.all([
          fetchInvoices({ sortBy: "date", sortDir: "desc" }),
          fetchAllPatients(),
          fetchAllAppointments(),
          fetchDentists(),
        ]);

        setInvoices(inv || []);
        setPatients(pats || []);
        setAppointments(appts || []);
        setDentists(docs || []);

        // fetch billing summaries for ALL patients
        const summaryPairs = await Promise.all(
          (pats || []).map(async (p) => {
            try {
              const s = await fetchPatientBillingSummary(p.id);
              return [p.id, s];
            } catch (err) {
              console.error("Failed billing summary for patient", p.id, err);
              return [p.id, null];
            }
          })
        );
        const summaryMap = {};
        for (const [pid, s] of summaryPairs) {
          if (s) summaryMap[pid] = s;
        }
        setPatientSummaries(summaryMap);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load reports data");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [checkedUser, user]);

  // ----- Compute billing stats whenever filters or data change -----
  useEffect(() => {
    // Only compute if admin + we have patients
    if (!patients.length || !isAdminUser(user)) {
      setBillingStats(null);
      return;
    }

    const stats = computeBillingStats({
      invoices,
      patients,
      appointments,
      patientSummaries,
      dateRange,
      selectedDoctorId,
    });

    setBillingStats(stats);
  }, [
    invoices,
    patients,
    appointments,
    patientSummaries,
    dateRange,
    selectedDoctorId,
    user,
  ]);

  // ----- Load inventory report only when needed (admin only) -----
  useEffect(() => {
    if (activeTab !== "inventory" || !isAdminUser(user)) return;

    const loadInventory = async () => {
      try {
        setLoadingInventory(true);
        setError("");

        const res = await fetch(
          `${API_BASE}/api/reports/inventory?date_range=${dateRange}`
        );
        if (!res.ok) {
          throw new Error(
            `Failed to load inventory report (status ${res.status})`
          );
        }

        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          throw new Error("Inventory report did not return JSON.");
        }

        const data = await res.json();
        setInventoryReport(data);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load inventory report");
      } finally {
        setLoadingInventory(false);
      }
    };

    loadInventory();
  }, [activeTab, dateRange, user]);

  const currentRangeLabel = RANGE_LABELS[dateRange] || "Last Month";

  const handleExport = () => {
    if (activeTab === "billing" && billingStats) {
      // ----- BILLING CSV -----
      const doctorName =
        selectedDoctorId === "all"
          ? "All doctors"
          : dentists.find((d) => String(d.id) === String(selectedDoctorId))
              ?.name || "Unknown doctor";

      let csv = "";
      csv += "Billing Report\n";
      csv += `Doctor,${doctorName}\n`;
      csv += `Date range,${currentRangeLabel}\n\n`;

      csv +=
        "Patient,Invoices (period),Total Paid (period),Outstanding (overall)\n";

      billingStats.rows.forEach((row) => {
        // Use raw numbers (no $) so Excel can treat them as numeric
        csv += `"${row.name}",${row.invoicesCount},${row.paidAmount},${row.outstanding}\n`;
      });

      const filename = `billing-report-${Date.now()}.csv`;
      downloadCsv(csv, filename);
    } else if (activeTab === "inventory" && inventoryReport) {
      // ----- INVENTORY CSV -----
      let csv = "";
      csv += "Inventory Report\n";
      csv += `Date range,${currentRangeLabel}\n\n`;

      csv += "Item Name,Current Stock,Consumed,Cost,Status\n";

      (inventoryReport.items || []).forEach((item) => {
        csv += `"${item.item}",${item.stock},${item.consumed},${item.cost},${item.status}\n`;
      });

      const filename = `inventory-report-${Date.now()}.csv`;
      downloadCsv(csv, filename);
    }
  };

  // ✅ Wait until we know if there is a user
  if (!checkedUser) {
    return null;
  }

  // ❌ Not logged in OR not admin → block Reports entirely
  if (!user || !isAdminUser(user)) {
    const isLoggedOut = !user;

    return (
        <div className="app-layout">
      <Sidebar />
      <div className="staff-main reports-main">
        <div className="staff-card">
          <h1 className="staff-page-title">Access denied</h1>
          <p style={{ marginTop: 6, color: "#6b7280", fontSize: 14 }}>
            {isLoggedOut
              ? "You must be logged in as an administrator to view reports."
              : "You do not have permission to view reports. Please contact an administrator if you think this is a mistake."}
          </p>
          <button
            className="btn-secondary"
            style={{ marginTop: 16 }}
            onClick={() =>
              isLoggedOut
                ? (window.location.href = "/login")
                : window.history.back()
            }
          >
            {isLoggedOut ? "Go to login" : "Go back"}
          </button>
        </div>
      </div>
        </div>
    );
  }

  // ✅ Admin: normal Reports UI
  return (
    
    <div className="app-layout">
      <Sidebar />
    <div className="staff-main reports-main">
      <div className="staff-page-header reports-header">
        <div>
          <h1 className="staff-page-title">Reports</h1>
          <p className="reports-subtitle">
            Track revenue, payments, and inventory performance.
          </p>
        </div>

        <div className="reports-header-right">
          {activeTab === "billing" && (
            <select
              className="staff-input reports-doctor-select"
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
            >
              <option value="all">All doctors</option>
              {dentists.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}

          <select
            className="staff-input reports-range-select"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="week">Last 7 days</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last 3 Months</option>
            <option value="year">Last Year</option>
          </select>

          <button
            className="btn-primary"
            onClick={handleExport}
            disabled={
              loading ||
              (activeTab === "billing" && !billingStats) ||
              (activeTab === "inventory" && !inventoryReport)
            }
          >
            Export Report
          </button>
        </div>
      </div>

      <div className="reports-tabs">
        <button
          className={
            activeTab === "billing"
              ? "reports-tab-button active"
              : "reports-tab-button"
          }
          onClick={() => setActiveTab("billing")}
        >
          Billing Reports
        </button>

        <button
          className={
            activeTab === "inventory"
              ? "reports-tab-button active"
              : "reports-tab-button"
          }
          onClick={() => setActiveTab("inventory")}
        >
          Inventory Reports
        </button>
      </div>

      {error && (
        <div
          className="inline-message inline-message-error"
          style={{ marginBottom: 12 }}
        >
          <div className="inline-message-title">Unable to load reports</div>
          <div className="inline-message-body">{error}</div>
        </div>
      )}

      {loading ? (
        <div className="inline-message inline-message-neutral">
          <div className="inline-message-title">Loading reports…</div>
          <div className="inline-message-body">
            This might take a few seconds if there are many invoices and
            patients.
          </div>
        </div>
      ) : (
        <>
          {activeTab === "billing" && billingStats && (
            <BillingTab
              stats={billingStats}
              currentRangeLabel={currentRangeLabel}
            />
          )}

          {activeTab === "inventory" && (
            <InventoryTab
              loading={loadingInventory}
              report={inventoryReport}
              currentRangeLabel={currentRangeLabel}
            />
          )}
        </>
      )}
    </div>
    </div>
  );
}

// ---------- COMPUTE BILLING STATS (PURE LOGIC) ----------

function computeBillingStats({
  invoices,
  patients,
  appointments,
  patientSummaries,
  dateRange,
  selectedDoctorId,
}) {
  // 1) Figure out which patients belong to the selected doctor
  const allPatientIds = patients.map((p) => p.id);

  const doctorIdNum =
    selectedDoctorId === "all" ? null : Number(selectedDoctorId) || null;

  let allowedPatientIdsSet;

  if (!doctorIdNum) {
    // All doctors -> ALL patients
    allowedPatientIdsSet = new Set(allPatientIds);
  } else {
    // patients that have at least one appointment with this doctor
    const patientIdsForDoctor = appointments
      .filter((a) => a.dentist_id === doctorIdNum && a.patient_id != null)
      .map((a) => a.patient_id);

    allowedPatientIdsSet = new Set(patientIdsForDoctor);
  }

  // 2) Filter invoices by date range AND by allowed patients
  const invoicesInRange = filterInvoicesByRange(invoices, dateRange).filter(
    (inv) => inv.patient_id != null && allowedPatientIdsSet.has(inv.patient_id)
  );

  let totalPaidPeriod = 0;
  const patientIdsWithPaymentInPeriod = new Set();

  invoicesInRange.forEach((inv) => {
    const amt = Number(inv.amount || 0);
    totalPaidPeriod += amt;
    if (inv.patient_id != null) {
      patientIdsWithPaymentInPeriod.add(inv.patient_id);
    }
  });

  const invoiceCount = invoicesInRange.length;
  const distinctPayers = patientIdsWithPaymentInPeriod.size;
  const avgPaidPerPerson = distinctPayers
    ? totalPaidPeriod / distinctPayers
    : 0;

  // 3) Use billing summaries for ALL allowed patients (even if no payment)
  const allowedPatientIds = Array.from(allowedPatientIdsSet);

  let totalCostAll = 0;
  let totalPaidAll = 0;
  let outstandingAll = 0;

  const rows = [];

  allowedPatientIds.forEach((pid) => {
    const patient = patients.find((p) => p.id === pid);
    const summary = patientSummaries[pid] || {};

    const totalCost = Number(summary.total_cost || 0);
    const totalPaidAllForPatient = Number(summary.total_paid || 0);
    const outstanding =
      summary.outstanding != null
        ? Number(summary.outstanding)
        : Math.max(totalCost - totalPaidAllForPatient, 0);

    totalCostAll += totalCost;
    totalPaidAll += totalPaidAllForPatient;
    outstandingAll += outstanding;

    const invoicesForPatientInPeriod = invoicesInRange.filter(
      (inv) => inv.patient_id === pid
    );
    const invoicesCountPeriod = invoicesForPatientInPeriod.length;
    const paidPeriodForPatient = invoicesForPatientInPeriod.reduce(
      (sum, inv) => sum + Number(inv.amount || 0),
      0
    );

    rows.push({
      patient_id: pid,
      name: patient?.name || summary.patient_name || `Patient #${pid}`,
      invoicesCount: invoicesCountPeriod,
      paidAmount: paidPeriodForPatient,
      outstanding,
    });
  });

  // Sort by paid amount in period desc (but still includes everyone)
  rows.sort((a, b) => b.paidAmount - a.paidAmount);

  const collectionRate =
    totalCostAll > 0 ? Math.round((totalPaidAll / totalCostAll) * 100) : 0;

  return {
    totalRevenue: totalPaidPeriod,
    invoiceCount,
    avgPaidPerPerson,
    totalOutstanding: outstandingAll,
    collectionRate,
    rows,
  };
}

// ---------- BILLING TAB UI ----------

function BillingTab({ stats, currentRangeLabel }) {
  return (
    <>
      <div className="reports-card-grid">
        <div className="reports-card">
          <p className="reports-card-label">Total Revenue</p>
          <p className="reports-card-value">
            {formatCurrency(stats.totalRevenue)}
          </p>
          <p className="reports-card-sub">
            {stats.invoiceCount} invoice
            {stats.invoiceCount === 1 ? "" : "s"} • {currentRangeLabel}
          </p>
        </div>

        <div className="reports-card">
          <p className="reports-card-label">Average Paid per Patient</p>
          <p className="reports-card-value">
            {formatCurrency(stats.avgPaidPerPerson)}
          </p>
          <p className="reports-card-sub">
            Among patients who paid in this period
          </p>
        </div>

        <div className="reports-card">
          <p className="reports-card-label">Outstanding Balance</p>
          <p className="reports-card-value">
            {formatCurrency(stats.totalOutstanding)}
          </p>
          <p className="reports-card-sub">All patients combined</p>
        </div>

        <div className="reports-card">
          <p className="reports-card-label">Collection Rate</p>
          <p className="reports-card-value">{stats.collectionRate}%</p>
          <p className="reports-card-sub">Paid vs total billed (all time)</p>
        </div>
      </div>

      <div className="staff-card reports-table-card">
        <div className="reports-table-header">
          <h2>Patients by Revenue</h2>
          <p className="reports-table-sub">
            All patients in the selected doctor filter. Sorted by amount paid in
            the selected period.
          </p>
        </div>

        {stats.rows.length === 0 ? (
          <p className="reports-table-sub">
            No patients found for this filter and date range.
          </p>
        ) : (
          <table className="staff-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Invoices (period)</th>
                <th>Total Paid (period)</th>
                <th>Outstanding (overall)</th>
              </tr>
            </thead>
            <tbody>
              {stats.rows.map((p) => (
                <tr key={p.patient_id}>
                  <td>{p.name}</td>
                  <td>{p.invoicesCount}</td>
                  <td>{formatCurrency(p.paidAmount)}</td>
                  <td>{formatCurrency(p.outstanding)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

// ---------- INVENTORY TAB ----------

function InventoryTab({ loading, report, currentRangeLabel }) {
  if (loading) {
    return (
      <div className="inline-message inline-message-neutral">
        <div className="inline-message-title">Loading inventory report…</div>
        <div className="inline-message-body">
          Please wait while we fetch inventory usage for {currentRangeLabel}.
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="staff-card">
        <p className="reports-table-sub">
          No inventory data available yet for this range.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="reports-card-grid">
        <div className="reports-card">
          <p className="reports-card-label">Total Items</p>
          <p className="reports-card-value">{report.total_items}</p>
          <p className="reports-card-sub">
            {report.items?.length || 0} tracked categories
          </p>
        </div>

        <div className="reports-card">
          <p className="reports-card-label">
            Consumed ({currentRangeLabel})
          </p>
          <p className="reports-card-value">
            {report.consumed_this_period}
          </p>
          <p className="reports-card-sub">
            {report.low_stock_count} low-stock item
            {report.low_stock_count === 1 ? "" : "s"}
          </p>
        </div>

        <div className="reports-card">
          <p className="reports-card-label">Total Cost</p>
          <p className="reports-card-value">
            {formatCurrency(report.total_cost)}
          </p>
          <p className="reports-card-sub">Current inventory value</p>
        </div>

        <div className="reports-card">
          <p className="reports-card-label">Low Stock Items</p>
          <p className="reports-card-value">
            {report.low_stock_count}
          </p>
          <p className="reports-card-sub">Need reorder</p>
        </div>
      </div>

      <div className="staff-card reports-table-card">
        <div className="reports-table-header">
          <h2>Inventory Details</h2>
          <p className="reports-table-sub">
            Item stock levels and consumption.
          </p>
        </div>

        <table className="staff-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Current Stock</th>
              <th>Consumed</th>
              <th>Cost</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(report.items || []).map((item) => (
              <tr key={item.id}>
                <td>{item.item}</td>
                <td>{item.stock}</td>
                <td>{item.consumed}</td>
                <td>{formatCurrency(item.cost)}</td>
                <td>{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </>
  );
}