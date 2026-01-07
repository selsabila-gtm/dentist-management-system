import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/sidebar/sidebar";
import "./patientProfile.css";

const API_BASE = "http://127.0.0.1:5000/api";

export default function AppointmentHistory() {
  const navigate = useNavigate();
  const params = useParams();
  const patientId = params.patientId ?? params.id; // supports both route styles

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Tabs
  const tabs = useMemo(
    () => [
      { label: "General Info", path: `/patients/${patientId}` },
      { label: "Appointments", path: `/patients/${patientId}/appointments` },
      { label: "Treatment Plans", path: `/patients/${patientId}/treatment-plans` },
      { label: "Medical Records", path: `/patients/${patientId}/medical-records` },
      { label: "Prescriptions", path: `/patients/${patientId}/prescriptions` },
      { label: "Invoices/Payments", path: `/patients/${patientId}/invoices` },
    ],
    [patientId]
  );

  // ✅ Fetch appointments for this patient
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!patientId) {
        setError("Missing patient id in URL.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        // Your backend endpoint (based on what you used elsewhere)
        const res = await fetch(`${API_BASE}/appointments`);
        if (!res.ok) throw new Error("Failed to fetch appointments");

        const data = await res.json();
        const list = Array.isArray(data) ? data : [];

        // Filter only this patient's appointments
        const patientAppts = list
          .filter((a) => String(a.patient_id) === String(patientId))
          .sort((a, b) => {
            const da = new Date(`${a.date} ${a.time}`);
            const db = new Date(`${b.date} ${b.time}`);
            return db - da; // newest first
          });

        setAppointments(patientAppts);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load appointments.");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [patientId]);

  const getStatusColor = (status) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
      case "canceled":
        return "bg-gray-200 text-gray-700";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // ✅ Add appointment should open your existing appointment add page
  // and pass patientId so you can auto-select it there.
  const handleAddAppointment = () => {
    navigate(`/calendar/add?patientId=${patientId}`);
  };

  // Optional placeholder (later you can open appointment details page)
  const handleViewDetails = (appointmentId) => {
    alert(`Viewing details for appointment ${appointmentId}`);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="app-layout">
        <Sidebar />

        <main className="main-content">
          {/* Header */}
          <header className="page-header">
  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
    <button onClick={() => navigate("/patients")} className="secondary-button">
      ← Back to Patients
    </button>

    <div>
      <h1 className="page-title">Patient Profile</h1>
      <p className="page-subtitle">View patient information and history</p>
    </div>
  </div>
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

          {/* Title + Add */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Appointment History
                </h2>

                <button
                  onClick={handleAddAppointment}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Add Appointment
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

              {/* Loading */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <span className="text-gray-600">Loading appointments...</span>
                </div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No appointments found for this patient.</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Click "Add Appointment" to create one.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">
                          Date
                        </th>
                        <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">
                          Time
                        </th>
                        <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">
                          Dentist
                        </th>
                        <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">
                          Status
                        </th>
                        <th className="py-4 px-4"></th>
                      </tr>
                    </thead>

                    <tbody>
                      {appointments.map((appointment, index) => (
                        <tr
                          key={appointment.id}
                          className={`${
                            index !== appointments.length - 1
                              ? "border-b border-gray-100"
                              : ""
                          }`}
                        >
                          <td className="py-4 px-4 text-sm text-gray-600">
                            {appointment.date || "N/A"}
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-600">
                            {appointment.time || "N/A"}
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-600">
                            {appointment.dentist || "N/A"}
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                appointment.status
                              )}`}
                            >
                              {appointment.status || "unknown"}
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
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
