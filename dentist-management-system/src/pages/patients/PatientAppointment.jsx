import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../../components/sidebar/sidebar';
import "./patientProfile.css";

export default function AppointmentHistory() {
  const navigate = useNavigate();
  const { id } = useParams(); // Get patient ID from URL
  
  const appointments = [
    { id: 1, date: '2024-07-20', time: '10:00 AM', dentist: 'Dr. Emily Carter', status: 'scheduled' },
    { id: 2, date: '2024-05-15', time: '2:30 PM', dentist: 'Dr. Emily Carter', status: 'cancelled' },
    { id: 3, date: '2024-03-01', time: '9:00 AM', dentist: 'Dr. Emily Carter', status: 'completed' },
    { id: 4, date: '2024-01-10', time: '11:15 AM', dentist: 'Dr. Emily Carter', status: 'completed' },
    { id: 5, date: '2023-11-22', time: '1:00 PM', dentist: 'Dr. Emily Carter', status: 'completed' }
  ];

  // Tabs with labels and corresponding paths - using template literals
  const tabs = [
    { label: "General Info", path: `/patients/${id}` },
    { label: "Appointments", path: `/patients/${id}/appointments` },
    { label: "Treatment Plans", path: `/patients/${id}/treatment-plans` },
    { label: "Medical Records", path: `/patients/${id}/medical-records` },
    { label: "Prescriptions", path: `/patients/${id}/prescriptions` },
    { label: "Invoices/Payments", path: `/patients/${id}/invoices` },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-gray-200 text-gray-700';
      case 'completed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleViewDetails = (appointmentId) => {
    console.log('View details for appointment:', appointmentId);
    alert(`Viewing details for appointment ${appointmentId}`);
  };

  const handleAddAppointment = () => {
    console.log('Add new appointment');
    alert('Add Appointment dialog would open here');
  };

  return (
    <div className="app-layout">
      <div className="flex h-screen bg-gray-50">
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

        {/* Appointment History */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Appointment History</h2>
              <button
                onClick={handleAddAppointment}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Add Appointment
              </button>
            </div>

            {/* Table */}
            <div className="overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">Date</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">Time</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">Dentist</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">Status</th>
                    <th className="py-4 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment, index) => (
                    <tr key={appointment.id} className={`${index !== appointments.length - 1 ? 'border-b border-gray-100' : ''}`}>
                      <td className="py-4 px-4 text-sm text-gray-600">{appointment.date}</td>
                      <td className="py-4 px-4 text-sm text-gray-600">{appointment.time}</td>
                      <td className="py-4 px-4 text-sm text-gray-600">{appointment.dentist}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleViewDetails(appointment.id)}
                          className="text-sm bg-blue-50 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
    </div>
  );
}