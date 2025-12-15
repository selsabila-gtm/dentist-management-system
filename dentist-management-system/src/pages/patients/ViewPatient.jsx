import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/sidebar/sidebar";
import "./patientProfile.css";

export default function ViewPatient() {
  const navigate = useNavigate();
  const { id } = useParams(); // Get patient ID from URL

  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Tabs with labels and corresponding paths - using template literals
  const tabs = [
    { label: "General Info", path: `/patients/${id}` },
    { label: "Appointments", path: `/patients/${id}/appointments` },
    { label: "Treatment Plans", path: `/patients/${id}/treatment-plans` },
    { label: "Medical Records", path: `/patients/${id}/medical-records` },
    { label: "Prescriptions", path: `/patients/${id}/prescriptions` },
    { label: "Invoices/Payments", path: `/patients/${id}/invoices` },
  ];

  // Fetch patient info from backend
  useEffect(() => {
    const fetchPatient = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://127.0.0.1:5000/api/patients/${id}`);
        if (!res.ok) throw new Error("Failed to fetch patient data");

        const data = await res.json();
        setPatientData({
          firstName: data.first_name || data.name?.split(' ')[0] || '',
          lastName: data.last_name || data.name?.split(' ')[1] || '',
          dateOfBirth: data.date_of_birth,
          gender: data.gender,
          phoneNumber: data.phone,
          email: data.email,
          address: data.address,
          insuranceProvider: data.insurance_provider,
          policyNumber: data.insurance_policy_number,
          groupNumber: data.group_number,
        });
        setError("");
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [id]);

  if (loading) return <div className="p-8">Loading patient...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;
  if (!patientData) return <div className="p-8">No patient data found.</div>;

  return (
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

        {/* Patient Details */}
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Patient Details</h2>
          </div>

          <div className="card-body">
            <div className="history-row">
              <div className="history-label">First Name</div>
              <div className="history-value">{patientData.firstName}</div>
            </div>
            <div className="history-row">
              <div className="history-label">Last Name</div>
              <div className="history-value">{patientData.lastName}</div>
            </div>
            <div className="history-row">
              <div className="history-label">Date of Birth</div>
              <div className="history-value">{patientData.dateOfBirth}</div>
            </div>
            <div className="history-row">
              <div className="history-label">Gender</div>
              <div className="history-value">{patientData.gender}</div>
            </div>
            <div className="history-row">
              <div className="history-label">Phone Number</div>
              <div className="history-value">{patientData.phoneNumber}</div>
            </div>
            <div className="history-row">
              <div className="history-label">Email</div>
              <div className="history-value">{patientData.email}</div>
            </div>
            <div className="history-row">
              <div className="history-label">Address</div>
              <div className="history-value">{patientData.address}</div>
            </div>
          </div>
        </section>

        {/* Insurance Information */}
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Insurance Information</h2>
          </div>

          <div className="card-body">
            <div className="history-row">
              <div className="history-label">Insurance Provider</div>
              <div className="history-value">{patientData.insuranceProvider}</div>
            </div>
            <div className="history-row">
              <div className="history-label">Policy Number</div>
              <div className="history-value">{patientData.policyNumber}</div>
            </div>
            <div className="history-row">
              <div className="history-label">Group Number</div>
              <div className="history-value">{patientData.groupNumber}</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}