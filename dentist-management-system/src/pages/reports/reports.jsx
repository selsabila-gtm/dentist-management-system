// src/pages/reports/Reports.jsx
import React, { useState, useEffect } from "react";
import "./reports.css";

const API_BASE = "http://localhost:5000/api";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("billing");
  const [dateRange, setDateRange] = useState("month");
  const [loading, setLoading] = useState(true);

  // Mock data - replace with actual API calls later
  const [billingData, setBillingData] = useState({
    totalRevenue: 90000,
    paidInvoices: 85500,
    outstanding: 4500,
    avgInvoice: 245,
    totalInvoices: 367,
    pendingCount: 15,
    collectionRate: 95,
  });

  const [paymentData, setPaymentData] = useState({
    paid: { count: 312, amount: 85500 },
    unpaid: { count: 37, amount: 4200 },
    partial: { count: 18, amount: 300 },
  });

  const [inventoryData, setInventoryData] = useState([
    { id: 1, item: "Dental Masks", stock: 450, consumed: 120, cost: 890, status: "good" },
    { id: 2, item: "Gloves", stock: 1200, consumed: 350, cost: 420, status: "good" },
    { id: 3, item: "Syringes", stock: 300, consumed: 85, cost: 650, status: "good" },
    { id: 4, item: "Anesthetics", stock: 150, consumed: 45, cost: 1200, status: "low" },
    { id: 5, item: "Cotton Rolls", stock: 800, consumed: 200, cost: 180, status: "good" },
  ]);

  const [procedureRevenue, setProcedureRevenue] = useState([
    { procedure: "Routine Checkup", count: 145, revenue: 7250 },
    { procedure: "Teeth Cleaning", count: 98, revenue: 9800 },
    { procedure: "Filling", count: 67, revenue: 10050 },
    { procedure: "Root Canal", count: 23, revenue: 11500 },
    { procedure: "Extraction", count: 34, revenue: 5100 },
  ]);

  const [recentPayments, setRecentPayments] = useState([
    { id: 1, date: "2025-12-10", patient: "John Doe", invoice: "INV-2341", amount: 250, status: "paid" },
    { id: 2, date: "2025-12-10", patient: "Sarah Smith", invoice: "INV-2340", amount: 180, status: "paid" },
    { id: 3, date: "2025-12-09", patient: "Mike Johnson", invoice: "INV-2339", amount: 420, status: "partial" },
    { id: 4, date: "2025-12-09", patient: "Emma Wilson", invoice: "INV-2338", amount: 150, status: "paid" },
    { id: 5, date: "2025-12-08", patient: "David Brown", invoice: "INV-2337", amount: 300, status: "unpaid" },
  ]);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleExport = () => {
    alert("Export functionality will be implemented soon!");
  };

  if (loading) {
    return (
      <div className="app-layout">
        <main className="main-content">
          <p>Loading reports...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <main className="main-content">
        {/* Header */}
        <header className="page-header">
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">
            Track revenue, payments, and inventory performance
          </p>
        </header>

        {/* Filter Controls */}
        <div className="reports-controls">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="date-range-select"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
          <button className="pill-button" onClick={handleExport}>
            Export Report
          </button>
        </div>

        {/* Tabs */}
        <div className="tabs-row">
          <button
            className={`tab-btn ${activeTab === "billing" ? "active" : ""}`}
            onClick={() => setActiveTab("billing")}
          >
            Billing Reports
          </button>
          <button
            className={`tab-btn ${activeTab === "payments" ? "active" : ""}`}
            onClick={() => setActiveTab("payments")}
          >
            Payment Tracking
          </button>
          <button
            className={`tab-btn ${activeTab === "inventory" ? "active" : ""}`}
            onClick={() => setActiveTab("inventory")}
          >
            Inventory Reports
          </button>
        </div>

        {/* BILLING TAB */}
        {activeTab === "billing" && (
          <div className="reports-content">
            {/* Summary Cards */}
            <div className="summary-grid">
              <div className="summary-card blue">
                <div className="summary-content">
                  <p className="summary-label">Total Revenue</p>
                  <p className="summary-value">${billingData.totalRevenue.toLocaleString()}</p>
                  <p className="summary-trend positive">↑ 12% from last month</p>
                </div>
                <div className="summary-icon blue">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
              </div>

              <div className="summary-card green">
                <div className="summary-content">
                  <p className="summary-label">Paid Invoices</p>
                  <p className="summary-value">${billingData.paidInvoices.toLocaleString()}</p>
                  <p className="summary-trend">{billingData.collectionRate}% collection rate</p>
                </div>
                <div className="summary-icon green">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                    <polyline points="16 7 22 7 22 13"></polyline>
                  </svg>
                </div>
              </div>

              <div className="summary-card orange">
                <div className="summary-content">
                  <p className="summary-label">Outstanding</p>
                  <p className="summary-value">${billingData.outstanding.toLocaleString()}</p>
                  <p className="summary-trend">{billingData.pendingCount} pending invoices</p>
                </div>
                <div className="summary-icon orange">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
              </div>

              <div className="summary-card purple">
                <div className="summary-content">
                  <p className="summary-label">Avg. Invoice</p>
                  <p className="summary-value">${billingData.avgInvoice}</p>
                  <p className="summary-trend">{billingData.totalInvoices} total invoices</p>
                </div>
                <div className="summary-icon purple">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
              </div>
            </div>

            {/* Revenue by Procedure */}
            <section className="card">
              <div className="card-header">
                <h2 className="card-title">Revenue by Procedure</h2>
              </div>

              <div className="table-wrapper">
                <table className="records-table">
                  <thead>
                    <tr>
                      <th>Procedure</th>
                      <th>Count</th>
                      <th>Revenue</th>
                      <th>Avg. Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {procedureRevenue.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.procedure}</td>
                        <td>{item.count}</td>
                        <td className="link-like">${item.revenue.toLocaleString()}</td>
                        <td>${Math.round(item.revenue / item.count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* PAYMENTS TAB */}
        {activeTab === "payments" && (
          <div className="reports-content">
            {/* Payment Status Cards */}
            <div className="payment-status-grid">
              <div className="payment-status-card paid">
                <div className="payment-status-content">
                  <div>
                    <p className="payment-status-label">Paid</p>
                    <p className="payment-status-count">{paymentData.paid.count} invoices</p>
                  </div>
                  <div className="payment-status-amount">
                    <p className="payment-amount-label">Amount</p>
                    <p className="payment-amount-value">${paymentData.paid.amount.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="payment-status-card unpaid">
                <div className="payment-status-content">
                  <div>
                    <p className="payment-status-label">Unpaid</p>
                    <p className="payment-status-count">{paymentData.unpaid.count} invoices</p>
                  </div>
                  <div className="payment-status-amount">
                    <p className="payment-amount-label">Amount</p>
                    <p className="payment-amount-value">${paymentData.unpaid.amount.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="payment-status-card partial">
                <div className="payment-status-content">
                  <div>
                    <p className="payment-status-label">Partial</p>
                    <p className="payment-status-count">{paymentData.partial.count} invoices</p>
                  </div>
                  <div className="payment-status-amount">
                    <p className="payment-amount-label">Amount</p>
                    <p className="payment-amount-value">${paymentData.partial.amount.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Payments */}
            <section className="card">
              <div className="card-header">
                <h2 className="card-title">Recent Payments</h2>
                <button className="view-all-link">View All</button>
              </div>

              <div className="table-wrapper">
                <table className="records-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Patient</th>
                      <th>Invoice #</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayments.map((payment) => (
                      <tr key={payment.id}>
                        <td>{payment.date}</td>
                        <td>{payment.patient}</td>
                        <td className="link-like">{payment.invoice}</td>
                        <td>${payment.amount}</td>
                        <td>
                          <span className={`status-pill ${payment.status}`}>
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* INVENTORY TAB */}
        {activeTab === "inventory" && (
          <div className="reports-content">
            {/* Inventory Summary Cards */}
            <div className="summary-grid">
              <div className="summary-card blue">
                <div className="summary-content">
                  <p className="summary-label">Total Items</p>
                  <p className="summary-value">2,900</p>
                  <p className="summary-trend">5 categories</p>
                </div>
                <div className="summary-icon blue">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                </div>
              </div>

              <div className="summary-card orange">
                <div className="summary-content">
                  <p className="summary-label">Consumed (Month)</p>
                  <p className="summary-value">800</p>
                  <p className="summary-trend">28% of stock</p>
                </div>
                <div className="summary-icon orange">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                    <polyline points="16 7 22 7 22 13"></polyline>
                  </svg>
                </div>
              </div>

              <div className="summary-card green">
                <div className="summary-content">
                  <p className="summary-label">Total Cost</p>
                  <p className="summary-value">$3,340</p>
                  <p className="summary-trend">Current inventory</p>
                </div>
                <div className="summary-icon green">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
              </div>

              <div className="summary-card red">
                <div className="summary-content">
                  <p className="summary-label">Low Stock Items</p>
                  <p className="summary-value">2</p>
                  <p className="summary-trend negative">Needs reorder</p>
                </div>
                <div className="summary-icon red">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                </div>
              </div>
            </div>

            {/* Inventory Details */}
            <section className="card">
              <div className="card-header">
                <h2 className="card-title">Inventory Details</h2>
              </div>

              <div className="table-wrapper">
                <table className="records-table">
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
                    {inventoryData.map((item) => (
                      <tr key={item.id}>
                        <td>{item.item}</td>
                        <td>{item.stock}</td>
                        <td>{item.consumed}</td>
                        <td className="link-like">${item.cost}</td>
                        <td>
                          <span className={`status-pill ${item.status === 'good' ? 'completed' : 'proposed'}`}>
                            {item.status === 'good' ? 'In Stock' : item.status === 'low' ? 'Low Stock' : 'Critical'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}