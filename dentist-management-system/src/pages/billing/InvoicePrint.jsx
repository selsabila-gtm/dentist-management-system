// src/pages/billing/InvoicePrint.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../../styles/staff.css";
import "./billing.css";
import Sidebar from "../../components/Sidebar/Sidebar";
import {
  fetchInvoiceById,
  fetchPatientBillingSummary,
} from "../../services/billingApi";

function formatCurrency(value) {
  const num = Number(value || 0);
  return `$${num.toFixed(2)}`;
}

export default function InvoicePrintPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const inv = await fetchInvoiceById(id);
        setInvoice(inv);

        if (inv.patient_id) {
          const s = await fetchPatientBillingSummary(inv.patient_id);
          setSummary(s);
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load invoice");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
      <div className="staff-main">
        <p>Loading invoice…</p>
      </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="app-layout">
        <Sidebar />
      <div className="staff-main">
        <p className="staff-error-text">{error || "Invoice not found."}</p>
        <button className="btn-secondary" onClick={() => navigate("/billing")}>
          Back to Billing
        </button>
      </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
    <div className="staff-main">
      <div className="staff-page-header">
        <h1 className="staff-page-title">Invoice {invoice.invoice_number}</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-secondary" onClick={() => navigate("/billing")}>
            Back
          </button>
          <button className="btn-primary" onClick={handlePrint}>
            Print
          </button>
        </div>
      </div>

      <div className="staff-card billing-invoice-print">
        {/* Header */}
        <div className="billing-invoice-header">
          <div>
            <h2>DentalCloud</h2>
            <p style={{ fontSize: 13, color: "#6b7280" }}>
              Dental clinic invoice
            </p>
          </div>
          <div style={{ textAlign: "right", fontSize: 14 }}>
            <div>
              <strong>Invoice #:</strong> {invoice.invoice_number}
            </div>
            <div>
              <strong>Date:</strong> {invoice.date}
            </div>
          </div>
        </div>

        {/* Patient info */}
        <div className="billing-invoice-section">
          <h3>Patient</h3>
          <p style={{ fontSize: 14 }}>
            {invoice.patient_name || "Unknown patient"}
          </p>
        </div>

        {/* Payment details for this invoice */}
        <div className="billing-invoice-section">
          <h3>Payment details</h3>
          <table className="staff-table" style={{ marginTop: 8 }}>
            <thead>
              <tr>
                <th>Description</th>
                <th style={{ textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Payment on this invoice</td>
                <td style={{ textAlign: "right" }}>
                  {formatCurrency(invoice.amount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Overall balance for that patient */}
        {summary && (
          <div className="billing-invoice-section">
            <h3>Patient balance summary</h3>
            <div className="billing-summary-row">
              <span>Total from appointments</span>
              <strong>{formatCurrency(summary.total_cost)}</strong>
            </div>
            <div className="billing-summary-row">
              <span>Total already paid</span>
              <strong>{formatCurrency(summary.total_paid)}</strong>
            </div>
            <div className="billing-summary-row billing-summary-outstanding">
              <span>Outstanding balance</span>
              <strong>{formatCurrency(summary.outstanding)}</strong>
            </div>
          </div>
        )}

        <p
          style={{
            marginTop: 16,
            fontSize: 12,
            color: "#9ca3af",
          }}
        >
          This document confirms the payment for the amount listed above and
          shows the remaining balance for the patient at the time of issue.
        </p>
      </div>
    </div>
    </div>
  );
}
