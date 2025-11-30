// src/pages/patients/MedicalRecords.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./patientProfile.css";
const API_BASE = "http://localhost:5000/api";
const PATIENT_ID = 1; // demo patient created in backend seed

export default function MedicalRecordsPage() {
  const navigate = useNavigate();

  const [medicalHistory, setMedicalHistory] = useState({
    pastDiagnoses: "",
    allergies: "",
    medications: "",
  });
  const [isEditingHistory, setIsEditingHistory] = useState(false);

  const [documents, setDocuments] = useState([]);
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [newDoc, setNewDoc] = useState({
    name: "",
    date: "",
    type: "",
  });

  const [loading, setLoading] = useState(true);

  // ---------- LOAD DATA FROM BACKEND ONCE ----------
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(
          `${API_BASE}/patients/${PATIENT_ID}/medical-record`
        );
        const data = await res.json();

        if (!res.ok) {
          console.error("Failed to load medical record", data);
          alert(data.error || "Could not load medical record from server.");
          return;
        }

        const history = data.medical_history || {};
        setMedicalHistory({
          pastDiagnoses: history.past_diagnoses || "",
          allergies: history.allergies || "",
          medications: history.medications || "",
        });

        setDocuments(data.documents || []);
      } catch (err) {
        console.error("Failed to load medical record", err);
        alert("Could not connect to backend server.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // ---------- HANDLERS ----------

  const handleHistoryChange = (field, value) => {
    setMedicalHistory((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveHistory = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(
        `${API_BASE}/patients/${PATIENT_ID}/medical-history`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            past_diagnoses: medicalHistory.pastDiagnoses,
            allergies: medicalHistory.allergies,
            medications: medicalHistory.medications,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        console.error("Failed to save medical history", data);
        alert(data.error || "Failed to save medical history.");
        return;
      }

      alert("Medical history saved.");
      setIsEditingHistory(false);
    } catch (err) {
      console.error(err);
      alert("Could not connect to backend while saving.");
    }
  };

  const handleAddDocument = async (e) => {
    e.preventDefault();
    if (!newDoc.name || !newDoc.date || !newDoc.type) {
      alert("Please fill in all document fields.");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/patients/${PATIENT_ID}/documents`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newDoc),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        console.error("Failed to add document", data);
        alert(data.error || "Failed to add document.");
        return;
      }

      // Add the new document returned by the backend
      setDocuments((prev) => [...prev, data.document]);

      // reset form
      setNewDoc({ name: "", date: "", type: "" });
      setShowAddDoc(false);
    } catch (err) {
      console.error(err);
      alert("Could not connect to backend while adding document.");
    }
  };

  // ---------- UI ----------

  if (loading) {
    return (
      <div className="app-layout">
        <main className="main-content">
          <p>Loading medical record...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">

      {/* ───── Main Content ───── */}
      <main className="main-content">
        {/* Header */}
        <header className="page-header">
          <h1 className="page-title">Patient Profile</h1>
          <p className="page-subtitle">
            Comprehensive view of patient information and history
          </p>
        </header>

        {/* Tabs */}
        <div className="tabs-row">
          <button className="tab-btn">General Info</button>
          <button className="tab-btn">Appointments</button>
          <button
            className="tab-btn"
            onClick={() => navigate("/patients/treatment-plans")}
          >
            Treatment Plans
          </button>
          <button className="tab-btn active">Medical Records</button>
          <button
            className="tab-btn"
            onClick={() => navigate("/patients/prescriptions")}
          >
            Prescriptions
          </button>
          <button className="tab-btn">Invoices/Payments</button>
        </div>

        {/* Medical History Card */}
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Medical History</h2>
            {!isEditingHistory && (
              <button
                className="pill-button"
                type="button"
                onClick={() => setIsEditingHistory(true)}
              >
                Edit
              </button>
            )}
          </div>

          {isEditingHistory ? (
            <form className="history-form" onSubmit={handleSaveHistory}>
              <div className="history-row">
                <div className="history-label">Past Diagnoses</div>
                <textarea
                  className="history-input"
                  value={medicalHistory.pastDiagnoses}
                  onChange={(e) =>
                    handleHistoryChange("pastDiagnoses", e.target.value)
                  }
                />
              </div>

              <div className="history-row">
                <div className="history-label">Allergies</div>
                <input
                  className="history-input"
                  type="text"
                  value={medicalHistory.allergies}
                  onChange={(e) =>
                    handleHistoryChange("allergies", e.target.value)
                  }
                />
              </div>

              <div className="history-row">
                <div className="history-label">Medications</div>
                <textarea
                  className="history-input"
                  value={medicalHistory.medications}
                  onChange={(e) =>
                    handleHistoryChange("medications", e.target.value)
                  }
                />
              </div>

              <div className="history-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsEditingHistory(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Save
                </button>
              </div>
            </form>
          ) : (
            <div className="history-view">
              <div className="history-row">
                <div className="history-label">Past Diagnoses</div>
                <div className="history-value">
                  {medicalHistory.pastDiagnoses || "—"}
                </div>
              </div>

              <div className="history-row">
                <div className="history-label">Allergies</div>
                <div className="history-value">
                  {medicalHistory.allergies || "—"}
                </div>
              </div>

              <div className="history-row">
                <div className="history-label">Medications</div>
                <div className="history-value">
                  {medicalHistory.medications || "—"}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Relevant Documents Card */}
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Relevant Documents</h2>
            <button
              className="pill-button"
              type="button"
              onClick={() => setShowAddDoc(true)}
            >
              Add Document
            </button>
          </div>

          {showAddDoc && (
            <form className="add-doc-form" onSubmit={handleAddDocument}>
              <input
                type="text"
                placeholder="Document name"
                className="add-doc-input"
                value={newDoc.name}
                onChange={(e) =>
                  setNewDoc((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              <input
                type="date"
                className="add-doc-input"
                value={newDoc.date}
                onChange={(e) =>
                  setNewDoc((prev) => ({ ...prev, date: e.target.value }))
                }
              />
              <input
                type="text"
                placeholder="Type (e.g. Radiology)"
                className="add-doc-input"
                value={newDoc.type}
                onChange={(e) =>
                  setNewDoc((prev) => ({ ...prev, type: e.target.value }))
                }
              />

              <div className="add-doc-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setShowAddDoc(false);
                    setNewDoc({ name: "", date: "", type: "" });
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Add
                </button>
              </div>
            </form>
          )}

          <div className="table-wrapper">
            <table className="records-table">
              <thead>
                <tr>
                  <th>Document Name</th>
                  <th>Date</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>{doc.name}</td>
                    <td className="link-like">{doc.date}</td>
                    <td>{doc.type}</td>
                  </tr>
                ))}

                {documents.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ color: "#6b7280" }}>
                      No documents yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
