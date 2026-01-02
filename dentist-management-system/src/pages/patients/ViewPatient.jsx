import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/sidebar/sidebar";
import "./patientProfile.css";

const API_BASE = "http://127.0.0.1:5000/api";

export default function ViewPatient() {
  const navigate = useNavigate();
  const params = useParams();
  const patientId = params.patientId ?? params.id;

  const [patientData, setPatientData] = useState(null); // original data
  const [editableData, setEditableData] = useState(null); // temp editing copy
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Notification modal
  const [notification, setNotification] = useState({
    open: false,
    type: "", // "success" | "error"
    message: "",
  });

  const tabs = [
    { label: "General Info", path: `/patients/${patientId}` },
    { label: "Appointments", path: `/patients/${patientId}/appointments` },
    { label: "Treatment Plans", path: `/patients/${patientId}/treatment-plans` },
    { label: "Medical Records", path: `/patients/${patientId}/medical-records` },
    { label: "Prescriptions", path: `/patients/${patientId}/prescriptions` },
    { label: "Invoices/Payments", path: `/patients/${patientId}/invoices` },
  ];

  // Fetch patient data
  useEffect(() => {
    const fetchPatient = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/patients/${patientId}`);
        if (!res.ok) throw new Error("Failed to fetch patient data");

        const data = await res.json();
        const formatted = {
          firstName: data.first_name || data.name?.split(" ")[0] || "",
          lastName: data.last_name || data.name?.split(" ")[1] || "",
          dateOfBirth: data.date_of_birth || "",
          gender: data.gender || "",
          phoneNumber: data.phone || "",
          email: data.email || "",
          address: data.address || "",
          insuranceProvider: data.insurance_provider || "",
          policyNumber: data.insurance_policy_number || "",
          groupNumber: data.group_number || "",
        };

        setPatientData(formatted);
        setEditableData(formatted);
        setError("");
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [patientId]);

  if (loading) return <div className="p-8">Loading patient...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;
  if (!patientData) return <div className="p-8">No patient data found.</div>;

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditableData((prev) => ({ ...prev, [name]: value }));
  };

  // Save changes
  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        first_name: editableData.firstName,
        last_name: editableData.lastName,
        date_of_birth: editableData.dateOfBirth,
        gender: editableData.gender,
        phone: editableData.phoneNumber,
        email: editableData.email,
        address: editableData.address,
        insurance_provider: editableData.insuranceProvider,
        insurance_policy_number: editableData.policyNumber,
        group_number: editableData.groupNumber,
      };

      const res = await fetch(`${API_BASE}/patients/${patientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save changes");

      setPatientData(editableData); // commit edits
      setEditing(false);

      // show success notification
      setNotification({
        open: true,
        type: "success",
        message: "Patient info updated successfully!",
      });
    } catch (err) {
      console.error(err);
      setNotification({
        open: true,
        type: "error",
        message: "Error saving patient info: " + err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setEditableData(patientData); // revert edits
    setEditing(false);
  };

  return (
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
              className={`tab-btn ${window.location.pathname === tab.path ? "active" : ""}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Edit/Save/Cancel Buttons */}
        <div style={{ margin: "16px 0" }}>
          {editing ? (
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving} className="primary-button">
                {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={handleCancel} className="secondary-button">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="primary-button">
              Edit Info
            </button>
          )}
        </div>

        {/* Patient Details */}
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Patient Details</h2>
          </div>

          <div className="card-body">
            {[
              "firstName",
              "lastName",
              "dateOfBirth",
              "gender",
              "phoneNumber",
              "email",
              "address",
            ].map((field) => (
              <div className="history-row" key={field}>
                <div className="history-label">
                  {field.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                </div>
                <div className="history-value">
                  {editing ? (
                    field === "gender" ? (
                      <select
                        name="gender"
                        value={editableData.gender || ""}
                        onChange={handleChange}
                        className="input-field"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    ) : field === "dateOfBirth" ? (
                      <input
                        type="date"
                        name={field}
                        value={editableData[field]}
                        onChange={handleChange}
                        className="input-field"
                      />
                    ) : (
                      <input
                        type="text"
                        name={field}
                        value={editableData[field]}
                        onChange={handleChange}
                        className="input-field"
                      />
                    )
                  ) : (
                    patientData[field]
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Insurance Information */}
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Insurance Information</h2>
          </div>

          <div className="card-body">
            {["insuranceProvider", "policyNumber", "groupNumber"].map((field) => (
              <div className="history-row" key={field}>
                <div className="history-label">
                  {field.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                </div>
                <div className="history-value">
                  {editing ? (
                    <input
                      type="text"
                      name={field}
                      value={editableData[field]}
                      onChange={handleChange}
                      className="input-field"
                    />
                  ) : (
                    patientData[field]
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* 🔔 Notification Modal */}
      {notification.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <p
              className={
                notification.type === "success" ? "text-green-600" : "text-red-600"
              }
            >
              {notification.message}
            </p>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setNotification({ ...notification, open: false })}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
