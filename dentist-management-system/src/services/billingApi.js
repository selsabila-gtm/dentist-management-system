// src/services/billingApi.js
const API_BASE = "http://localhost:5000/api";

async function handleResponse(res) {
  if (!res.ok) {
    let msg = "Request failed";
    try {
      const data = await res.json();
      msg = data.error || data.message || msg;
    } catch (e) {
      /* ignore */
    }
    throw new Error(msg);
  }
  return res.json();
}

export async function fetchPatientsSimple() {
  const res = await fetch(`${API_BASE}/patients`);
  return handleResponse(res);
}

export async function fetchInvoices(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set("q", params.search);
  if (params.patientId && params.patientId !== "all") {
    query.set("patient_id", params.patientId);
  }
  if (params.sortBy) query.set("sort_by", params.sortBy);
  if (params.sortDir) query.set("sort_dir", params.sortDir);

  const qs = query.toString();
  const url = qs ? `${API_BASE}/invoices?${qs}` : `${API_BASE}/invoices`;
  const res = await fetch(url);
  return handleResponse(res);
}

export async function fetchPatientBillingSummary(patientId) {
  const res = await fetch(`${API_BASE}/patients/${patientId}/billing-summary`);
  return handleResponse(res);
}

export async function createInvoice(payload) {
  const res = await fetch(`${API_BASE}/invoices`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

// src/services/billingApi.js

// ... your existing imports & functions ...

export async function fetchInvoiceById(id) {
  // simple: reuse the list endpoint and filter on the frontend
  const list = await fetchInvoices({});
  const numericId = Number(id);
  const invoice = list.find((inv) => Number(inv.id) === numericId);
  if (!invoice) {
    throw new Error("Invoice not found");
  }
  return invoice;
}

