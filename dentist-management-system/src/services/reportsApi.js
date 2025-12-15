// src/services/reportsApi.js
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

// BILLING REPORTS
export const fetchBillingReport = async (dateRange = "month") => {
  const res = await axios.get(`${API_BASE}/reports/billing`, {
    params: { date_range: dateRange }
  });
  return res.data;
};

// PAYMENT REPORTS
export const fetchPaymentsReport = async (dateRange = "month") => {
  const res = await axios.get(`${API_BASE}/reports/payments`, {
    params: { date_range: dateRange }
  });
  return res.data;
};

// INVENTORY REPORTS
export const fetchInventoryReport = async (dateRange = "month") => {
  const res = await axios.get(`${API_BASE}/reports/inventory`, {
    params: { date_range: dateRange }
  });
  return res.data;
};

// EXPORT REPORT (for future implementation)
export const exportReport = async (reportType, dateRange, format = "pdf") => {
  const res = await axios.get(`${API_BASE}/reports/export`, {
    params: { 
      type: reportType,
      date_range: dateRange,
      format: format
    },
    responseType: 'blob'
  });
  return res.data;
};