import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/sidebar/sidebar.jsx";
import "./patientProfile.css";

const API_BASE = "http://localhost:5000/api";
const PATIENT_ID = 1; // demo patient

export default function MedicalRecordsPage() {
  const navigate = useNavigate();

  // ---------------- STATE ----------------
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
    type: "pdf",
  });

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);

  // ---------------- LOAD DATA ----------------
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(
          `${API_BASE}/patients/${PATIENT_ID}/medical-record`
        );
        const data = await res.json();

        setMedicalHistory({
          pastDiagnoses: data.medical_history?.past_diagnoses || "",
          allergies: data.medical_history?.allergies || "",
          medications: data.medical_history?.medications || "",
        });

        setDocuments(data.documents || []);
      } catch (err) {
        console.error(err);
        alert("Failed to load medical record");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // ---------------- HANDLERS ----------------
  const handleHistoryChange = (field, value) => {
    setMedicalHistory((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveHistory = async (e) => {
    e.preventDefault();

    const res = await fetch(
      `${API_BASE}/patients/${PATIENT_ID}/medical-history`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          past_diagnoses: medicalHistory.pastDiagnoses,
          allergies: medicalHistory.allergies,
          medications: medicalHistory.medications,
        }),
      }
    );

    if (res.ok) {
      setIsEditingHistory(false);
      alert("Medical history saved");
    } else {
      alert("Failed to save medical history");
    }
  };

  const handleAddDocument = async (e) => {
    e.preventDefault();

    if (!newDoc.name || !file) {
      alert("Please provide document name and file");
      return;
    }

    const formData = new FormData();
    formData.append("name", newDoc.name);
    formData.append("type", newDoc.type);
    formData.append("file", file);

    const res = await fetch(
      `${API_BASE}/patients/${PATIENT_ID}/documents`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Upload failed");
      return;
    }

    setDocuments((prev) => [...prev, data]);
    setShowAddDoc(false);
    setNewDoc({ name: "", type: "pdf" });
    setFile(null);
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm("Delete this document?")) return;

    await fetch(
      `${API_BASE}/patients/${PATIENT_ID}/documents/${docId}`,
      { method: "DELETE" }
    );

    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  // ---------------- UI ----------------
  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <p>Loading medical record...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />

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

        {/* Medical History */}
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Medical History</h2>
            {!isEditingHistory && (
              <button
                className="pill-button"
                onClick={() => setIsEditingHistory(true)}
              >
                Edit
              </button>
            )}
          </div>

          {isEditingHistory ? (
            <form onSubmit={handleSaveHistory} className="history-form">
              <div className="form-group">
                <label>Past Diagnoses</label>
                <textarea
                  value={medicalHistory.pastDiagnoses}
                  onChange={(e) =>
                    handleHistoryChange("pastDiagnoses", e.target.value)
                  }
                  placeholder="Past diagnoses"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Allergies</label>
                <input
                  value={medicalHistory.allergies}
                  onChange={(e) =>
                    handleHistoryChange("allergies", e.target.value)
                  }
                  placeholder="Allergies"
                />
              </div>

              <div className="form-group">
                <label>Medications</label>
                <textarea
                  value={medicalHistory.medications}
                  onChange={(e) =>
                    handleHistoryChange("medications", e.target.value)
                  }
                  placeholder="Medications"
                  rows="3"
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
              <p>
                <strong>Past Diagnoses:</strong>{" "}
                {medicalHistory.pastDiagnoses || "—"}
              </p>
              <p>
                <strong>Allergies:</strong> {medicalHistory.allergies || "—"}
              </p>
              <p>
                <strong>Medications:</strong>{" "}
                {medicalHistory.medications || "—"}
              </p>
            </div>
          )}
        </section>

        {/* Documents */}
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Relevant Documents</h2>
            <button
              className="pill-button"
              onClick={() => setShowAddDoc(!showAddDoc)}
            >
              {showAddDoc ? "Cancel" : "Add Document"}
            </button>
          </div>

          {showAddDoc && (
            <form className="add-doc-form" onSubmit={handleAddDocument}>
              <div className="form-group">
                <label>Document Name</label>
                <input
                  type="text"
                  placeholder="Document name"
                  value={newDoc.name}
                  onChange={(e) =>
                    setNewDoc({ ...newDoc, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Document Type</label>
                <select
                  value={newDoc.type}
                  onChange={(e) =>
                    setNewDoc({ ...newDoc, type: e.target.value })
                  }
                >
                  <option value="pdf">PDF</option>
                  <option value="img">Image</option>
                </select>
              </div>

              <div className="form-group">
                <label>File</label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  accept={newDoc.type === "pdf" ? ".pdf" : "image/*"}
                  required
                />
              </div>

              <div className="add-doc-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setShowAddDoc(false);
                    setNewDoc({ name: "", type: "pdf" });
                    setFile(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Upload
                </button>
              </div>
            </form>
          )}

          <table className="records-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td>{doc.name}</td>
                  <td className="actions-cell">
                    <button
                      className="action-link"
                      onClick={() => window.open(`http://localhost:5000${doc.url}`, '_blank')}
                    >
                      View
                    </button>
                    <span className="separator">|</span>
                    <button
                      className="action-link"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = `http://localhost:5000${doc.url}`;
                        link.download = doc.name;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      Download
                    </button>
                    <span className="separator">|</span>
                    <button
                      className="action-link delete-link"
                      onClick={() => handleDeleteDocument(doc.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {documents.length === 0 && (
                <tr>
                  <td colSpan="2" className="no-data">
                    No documents available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}