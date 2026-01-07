// src/pages/billing/AddInvoice.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../../components/sidebar/sidebar";
import "../../styles/staff.css";
import "./billing.css";
import {
  createInvoice,
  fetchPatientsSimple,
  fetchPatientBillingSummary,
} from "../../services/billingApi";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatCurrency(value) {
  const num = Number(value || 0);
  return `$${num.toFixed(2)}`;
}

/* --------- Small toast UI --------- */
function Toast({ message, type = "info", onClose }) {
  if (!message) return null;
  return (
    <div className="toast-container">
      <div className={`toast toast-${type}`}>
        <span>{message}</span>
        <button
          type="button"
          className="toast-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default function AddInvoicePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const preselectedPatientId = query.get("patientId") || "";
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState(preselectedPatientId);
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [form, setForm] = useState({
    date: todayISO(),
    amount: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");

  // toast state
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "info") => {
    setToast({ message, type });
    // auto-hide after 3s
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const data = await fetchPatientsSimple();
        setPatients(data);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load patients");
      }
    };
    loadPatients();
  }, []);

  const loadSummary = async (id) => {
    if (!id) {
      setSummary(null);
      return;
    }
    try {
      setLoadingSummary(true);
      setError("");
      const data = await fetchPatientBillingSummary(id);
      setSummary(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load billing summary");
      setSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  };
  useEffect(() => {
  if (preselectedPatientId) {
    loadSummary(preselectedPatientId);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedPatientId]);


  const handlePatientChange = (e) => {
    const value = e.target.value;
    setPatientId(value);
    setFieldError("");
    loadSummary(value);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "amount") setFieldError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldError("");

    if (!patientId) {
      setFieldError("Please select a patient.");
      return;
    }

    if (!summary) {
      setFieldError("Cannot calculate outstanding balance for this patient.");
      return;
    }

    const outstanding = Number(summary.outstanding || 0);
    const amount = Number(form.amount);

    if (!amount || isNaN(amount) || amount <= 0) {
      setFieldError("Please enter a valid amount greater than 0.");
      return;
    }

    if (amount > outstanding + 1e-6) {
      setFieldError(
        `Amount cannot be more than outstanding balance (${formatCurrency(
          outstanding
        )}).`
      );
      return;
    }

    try {
      setSaving(true);
      await createInvoice({
        patient_id: patientId,
        amount,
        date: form.date, // no due_date sent; backend will default it
      });

      // 🔔 nice toast instead of browser alert
      showToast("Invoice created", "success");

      // small delay so user sees the toast, then go back to list
      setTimeout(() => {
        navigate("/billing");
      }, 600);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to create invoice");
      showToast("Failed to create invoice", "error");
    } finally {
      setSaving(false);
    }
  };

  const outstanding = summary ? Number(summary.outstanding || 0) : 0;

  return (
    <div className="app-layout">
      <Sidebar />
    <div className="staff-main">
      <div className="staff-page-header">
        <h1 className="staff-page-title">New Invoice</h1>
      </div>

      <form className="staff-card billing-form" onSubmit={handleSubmit}>
        <div className="billing-form-main">
          <div className="staff-field">
            <label>Patient</label>
            <select
              className="staff-input"
              value={patientId}
              onChange={handlePatientChange}
            >
              <option value="">Select patient</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="staff-field">
            <label>Date</label>
            <input
              type="date"
              name="date"
              className="staff-input"
              value={form.date}
              onChange={handleChange}
            />
          </div>

          <div className="staff-field">
            <label>Amount to charge now</label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="amount"
              className="staff-input"
              value={form.amount}
              onChange={handleChange}
              disabled={!summary || outstanding <= 0}
            />
            {fieldError && (
              <p className="staff-error-text" style={{ marginTop: 4 }}>
                {fieldError}
              </p>
            )}
          </div>
        </div>

        <div className="billing-summary-panel">
          <h2>Patient balance</h2>

          {loadingSummary && <p>Loading summary...</p>}

          {!loadingSummary && !summary && (
            <p className="billing-summary-placeholder">
              Select a patient to see their billing info.
            </p>
          )}

          {summary && (
            <>
              <div className="billing-summary-row">
                <span>Total from appointments</span>
                <strong>{formatCurrency(summary.total_cost)}</strong>
              </div>
              <div className="billing-summary-row">
                <span>Already paid</span>
                <strong>{formatCurrency(summary.total_paid)}</strong>
              </div>
              <div className="billing-summary-row billing-summary-outstanding">
                <span>Outstanding balance</span>
                <strong>{formatCurrency(summary.outstanding)}</strong>
              </div>

              {outstanding <= 0 && (
                <p className="billing-summary-note">
                  This patient has no outstanding balance. You cannot create a
                  new invoice.
                </p>
              )}
              {outstanding > 0 && (
                <p className="billing-summary-note">
                  The patient can pay any amount up to{" "}
                  <strong>{formatCurrency(outstanding)}</strong>.
                </p>
              )}
            </>
          )}
        </div>

        <div className="billing-form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate("/billing")}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={saving || !patientId || (!summary && !loadingSummary)}
          >
            {saving ? "Saving..." : "Create invoice"}
          </button>
        </div>

        {error && (
          <p className="staff-error-text" style={{ marginTop: 12 }}>
            {error}
          </p>
        )}
      </form>

      {/* Toast UI */}
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </div>
  </div>
  );
}
