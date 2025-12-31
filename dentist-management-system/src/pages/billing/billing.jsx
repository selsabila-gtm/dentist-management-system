// src/pages/billing/billing.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/staff.css";
import "./billing.css";
import { fetchInvoices, fetchPatientsSimple } from "../../services/billingApi";
import Sidebar from "../../components/sidebar/sidebar";

function formatCurrency(value) {
  const num = Number(value || 0);
  return `$${num.toFixed(2)}`;
}

export default function BillingPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloadFlag, setReloadFlag] = useState(0);
  const [search, setSearch] = useState("");
  const [patientFilter, setPatientFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        const [patientsRes, invoicesRes] = await Promise.all([
          fetchPatientsSimple(),
          fetchInvoices({ sortBy, sortDir }),
        ]);
        setPatients(patientsRes);
        setInvoices(invoicesRes);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load invoices");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [reloadFlag, sortBy, sortDir]);

  const filteredInvoices = useMemo(() => {
    let data = [...invoices];

    if (patientFilter !== "all") {
      data = data.filter(
        (inv) => String(inv.patient_id) === String(patientFilter)
      );
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter((inv) => {
        const name = (inv.patient_name || "").toLowerCase();
        const num = (inv.invoice_number || "").toLowerCase();
        return name.includes(q) || num.includes(q);
      });
    }

    // local sort (date or amount)
    data.sort((a, b) => {
      let valA;
      let valB;

      if (sortBy === "amount") {
        valA = Number(a.amount || 0);
        valB = Number(b.amount || 0);
      } else {
        // default: sort by date
        valA = a.date || "";
        valB = b.date || "";
      }

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [invoices, search, patientFilter, sortBy, sortDir]);

  const handleRefresh = () => setReloadFlag((x) => x + 1);

  const handlePrintClick = (invoiceId) => {
    navigate(`/billing/invoice/${invoiceId}`);
  };

  return (
    <div className="app-layout">
      <Sidebar />
    <div className="staff-main">
      <div className="staff-page-header">
        <h1 className="staff-page-title">Billing</h1>
        <button
          className="btn-primary"
          onClick={() => navigate("/billing/new")}
        >
          New Invoice
        </button>
      </div>

      <div className="staff-card billing-toolbar">
        <div className="billing-search-wrapper">
          <span className="billing-search-icon">🔍</span>
          <input
            type="text"
            className="staff-input billing-search-input"
            placeholder="Search invoices by patient or invoice #"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="billing-filters">
          <div className="billing-filter">
            <label>Patient</label>
            <select
              className="staff-input"
              value={patientFilter}
              onChange={(e) => setPatientFilter(e.target.value)}
            >
              <option value="all">All patients</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="billing-filter">
            <label>Sort by</label>
            <select
              className="staff-input"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date">Date added</option>
              <option value="amount">Amount</option>
            </select>
          </div>

          <div className="billing-filter">
            <label>Order</label>
            <select
              className="staff-input"
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value)}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>

          <button className="btn-secondary" onClick={handleRefresh}>
            Refresh
          </button>
        </div>
      </div>

      <div className="staff-card">
        {error && <p className="staff-error-text">{error}</p>}
        {loading ? (
          <p>Loading invoices...</p>
        ) : filteredInvoices.length === 0 ? (
          <p>No invoices found.</p>
        ) : (
          <table className="staff-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Amount</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.patient_name || "-"}</td>
                  <td>{inv.invoice_number}</td>
                  <td>{inv.date}</td>
                  <td>{formatCurrency(inv.amount)}</td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => handlePrintClick(inv.id)}
                    >
                      Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
    </div>
  );
}
