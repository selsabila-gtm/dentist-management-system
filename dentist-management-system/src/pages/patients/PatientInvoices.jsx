import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../../components/sidebar/sidebar';
import "./patientProfile.css";

export default function InvoicesPayments() {
  const navigate = useNavigate();
  const params = useParams();
const patientId = params.patientId ?? params.id;
 // Get patient ID from URL
  
  const [invoices, setInvoices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Tabs with labels and corresponding paths
  const tabs = [
  { label: "General Info", path: `/patients/${patientId}` },
  { label: "Appointments", path: `/patients/${patientId}/appointments` },
  { label: "Treatment Plans", path: `/patients/${patientId}/treatment-plans` },
  { label: "Medical Records", path: `/patients/${patientId}/medical-records` },
  { label: "Prescriptions", path: `/patients/${patientId}/prescriptions` },
  { label: "Invoices/Payments", path: `/patients/${patientId}/invoices` },
  ];


  // Fetch invoices and appointments from backend for this specific patient
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        
        // Fetch both invoices and appointments in parallel
        const [invoicesRes, appointmentsRes] = await Promise.all([
          fetch(`http://127.0.0.1:5000/api/invoices?patient_id=${patientId}`),
          fetch(`http://127.0.0.1:5000/api/appointments`)
        ]);
        
        if (!invoicesRes.ok || !appointmentsRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const invoicesData = await invoicesRes.json();
        const appointmentsData = await appointmentsRes.json();
        
        // Filter invoices for this patient
        const patientInvoices = Array.isArray(invoicesData) 
          ? invoicesData.filter(invoice => invoice.patient_id === parseInt(patientId))
          : [];
        
        // Filter appointments for this patient
        const patientAppointments = Array.isArray(appointmentsData)
          ? appointmentsData.filter(apt => apt.patient_id === parseInt(patientId))
          : [];
        
        setInvoices(patientInvoices);
        setAppointments(patientAppointments);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load invoices and appointments. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchData();
    }
  }, [patientId]);

  // Calculate totals
  const totalCost = appointments.reduce((sum, apt) => sum + (apt.cost || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const totalOutstanding = totalCost - totalPaid;

  const handleAddDocument = () => {
    console.log('Add invoice for patient:', patientId);
    alert('Add Invoice dialog would open here');
  };

  return (
  <div className="flex h-screen bg-gray-50">
    <div className="app-layout">
      
      <Sidebar />

      <main className="main-content">
        {/* Header */}
        <header className="page-header">
          <h1 className="page-title">Patient Profile</h1>
          <p className="page-subtitle">View patient information and history</p>
        </header>

        {/* Tabs */}
        <div className="tabs-row">
          {tabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => navigate(tab.path)}
              className={`tab-btn ${
                window.location.pathname === tab.path ? "active" : ""
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Page Title and Add Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Invoices & Payments</h2>
          <button
            onClick={handleAddDocument}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Add Invoice
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="text-sm text-gray-600 mb-2">Total Cost</div>
            <div className="text-3xl font-bold text-gray-900">${totalCost.toFixed(2)}</div>
            <div className="text-sm text-gray-500 mt-2">
              From {appointments.length} {appointments.length === 1 ? 'appointment' : 'appointments'}
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="text-sm text-gray-600 mb-2">Total Paid</div>
            <div className="text-3xl font-bold text-green-600">${totalPaid.toFixed(2)}</div>
            <div className="text-sm text-gray-500 mt-2">
              {invoices.length} {invoices.length === 1 ? 'payment' : 'payments'}
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="text-sm text-gray-600 mb-2">Outstanding Balance</div>
            <div className={`text-3xl font-bold ${totalOutstanding > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              ${totalOutstanding.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              {totalOutstanding > 0 ? 'Amount due' : 'Fully paid'}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Invoices Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="text-gray-600">Loading invoices...</span>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No invoices found for this patient.</p>
              <p className="text-gray-400 text-sm mt-2">Click "Add Invoice" to create one.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Invoice #</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Date</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Due Date</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice, index) => (
                  <tr 
                    key={invoice.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      index !== invoices.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <td className="py-4 px-6 text-sm text-gray-900 font-medium">
                      {invoice.invoice_number || `INV-${invoice.id}`}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {invoice.date || 'N/A'}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {invoice.due_date || 'N/A'}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900 font-semibold">
                      ${(invoice.amount || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 bg-gray-50">
                  <td colSpan="3" className="py-4 px-6 text-sm font-semibold text-gray-900 text-right">
                    Total Paid:
                  </td>
                  <td className="py-4 px-6 text-sm font-bold text-green-600">
                    ${totalPaid.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </main>
    </div>
    </div>
  );
}