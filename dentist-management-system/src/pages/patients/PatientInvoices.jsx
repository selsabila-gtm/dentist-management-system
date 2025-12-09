import React, { useState } from 'react';

export default function InvoicesPayments() {
  const [activeTab, setActiveTab] = useState('Invoices/Payments');
  
  const invoices = [
    { id: 'INV-2024-001', date: '2024-07-20', amount: 250.0, outstanding: 0.0, status: 'paid' },
    { id: 'INV-2024-002', date: '2024-07-25', amount: 150.0, outstanding: 150.0, status: 'unpaid' },
    { id: 'INV-2024-003', date: '2024-08-05', amount: 300.0, outstanding: 100.0, status: 'partially paid' },
    { id: 'INV-2024-004', date: '2024-08-15', amount: 100.0, outstanding: 0.0, status: 'paid' },
    { id: 'INV-2024-005', date: '2024-08-20', amount: 200.0, outstanding: 200.0, status: 'unpaid' }
  ];

  const tabs = [
    'General Info',
    'Appointments',
    'Treatment Plans',
    'Medical Records',
    'Prescriptions',
    'Invoices/Payments'
  ];

  const total = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.amount - inv.outstanding), 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.outstanding, 0);

  const getStatusColor = (status) => 'bg-gray-100 text-gray-700';

  const handleAddDocument = () => {
    console.log('Add document');
    alert('Add Document dialog would open here');
  };

  return (
    <div className="flex h-screen bg-gray-50">

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Profile</h1>
            <p className="text-gray-500">View and manage patient information</p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-8">
            <div className="flex gap-8">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`bg-white pb-4 px-1 font-medium transition-colors ${
                    activeTab === tab
                      ? 'text-gray-900 border-b-2 border-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Invoices & Payments</h2>
            <button
              onClick={handleAddDocument}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Add Document
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="text-sm text-gray-600 mb-2">Total</div>
              <div className="text-3xl font-bold text-gray-900">${total.toFixed(2)}</div>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="text-sm text-gray-600 mb-2">Total Paid</div>
              <div className="text-3xl font-bold text-gray-900">${totalPaid.toFixed(2)}</div>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="text-sm text-gray-600 mb-2">Total Outstanding</div>
              <div className="text-3xl font-bold text-gray-900">${totalOutstanding.toFixed(2)}</div>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-white">
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Invoice #</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Date</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Amount</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Outstanding Balance</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice, index) => (
                  <tr 
                    key={invoice.id}
                    className={`hover:bg-gray-50 transition-colors ${index !== invoices.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <td className="py-4 px-6 text-sm text-gray-900">{invoice.id}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{invoice.date}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">${invoice.amount.toFixed(2)}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">${invoice.outstanding.toFixed(2)}</td>
                    <td className="py-4 px-6">
                      <span className="inline-block px-3 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-700">
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
