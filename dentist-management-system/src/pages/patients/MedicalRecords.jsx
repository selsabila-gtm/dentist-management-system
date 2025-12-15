import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/sidebar/sidebar.jsx";
import "./patientProfile.css";

const API_BASE = "http://localhost:5000/api";
const API_FILE_BASE = "http://localhost:5000"; // files are served from /uploads/...

/* ------------------- POPUPS ------------------- */

function ToastPopup({ open, message, type = "success", onClose }) {
  if (!open) return null;

  return (
    <div className="toast-wrap">
      <div className={`toast toast-${type}`}>
        <span>{message}</span>
        <button className="toast-close" onClick={onClose}>
          ✕
        </button>
      </div>
    </div>
  );
}

function ConfirmPopup({
  open,
  title,
  message,
  confirmText = "OK",
  cancelText = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="popup-overlay" onClick={onCancel}>
      <div className="popup-modal" onClick={(e) => e.stopPropagation()}>
        <div className="popup-title">{title}</div>
        <div className="popup-message">{message}</div>

        <div className="popup-actions">
          <button className="popup-btn cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button className={`popup-btn ${variant}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewPopup({ open, doc, onClose }) {
  if (!open || !doc) return null;

  const isPdf = doc.type === "pdf";
  const fileUrl = `${API_FILE_BASE}${doc.url}`;

  return (
    <div className="preview-overlay" onClick={onClose}>
      <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="preview-header">
          <div className="preview-title">
            {doc.name} <span className="preview-badge">{isPdf ? "PDF" : "Image"}</span>
          </div>
          <button className="preview-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="preview-body">
          {isPdf ? (
            <iframe title="PDF Preview" src={fileUrl} className="preview-frame" />
          ) : (
            <img src={fileUrl} alt={doc.name} className="preview-image" />
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------- PAGE ------------------- */

export default function MedicalRecordsPage() {
  const navigate = useNavigate();
  const { patientId } = useParams();

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

  // popups
  const [toast, setToast] = useState({ open: false, message: "", type: "success" });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ open: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, open: false })), 2500);
  };

  // ---------------- LOAD DATA ----------------
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const res = await fetch(`${API_BASE}/patients/${patientId}/medical-record`);
        const data = await res.json();

        if (!res.ok) {
          showToast(data.error || "Failed to load medical record", "error");
          return;
        }

        setMedicalHistory({
          pastDiagnoses: data.medical_history?.past_diagnoses || "",
          allergies: data.medical_history?.allergies || "",
          medications: data.medical_history?.medications || "",
        });

        setDocuments(data.documents || []);
      } catch (err) {
        console.error(err);
        showToast("Failed to load medical record", "error");
      } finally {
        setLoading(false);
      }
    }

    if (patientId) loadData();
  }, [patientId]);

  // ---------------- HANDLERS ----------------
  const handleHistoryChange = (field, value) => {
    setMedicalHistory((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveHistory = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_BASE}/patients/${patientId}/medical-history`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          past_diagnoses: medicalHistory.pastDiagnoses,
          allergies: medicalHistory.allergies,
          medications: medicalHistory.medications,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setIsEditingHistory(false);
        showToast("Medical history saved", "success");
      } else {
        showToast(data.error || "Failed to save medical history", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Could not connect to backend", "error");
    }
  };

  const handleAddDocument = async (e) => {
    e.preventDefault();

    if (!newDoc.name || !file) {
      showToast("Please provide document name and file", "error");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", newDoc.name);
      formData.append("type", newDoc.type);
      formData.append("file", file);

      const res = await fetch(`${API_BASE}/patients/${patientId}/documents`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Upload failed", "error");
        return;
      }

      setDocuments((prev) => [...prev, data]);
      setShowAddDoc(false);
      setNewDoc({ name: "", type: "pdf" });
      setFile(null);
      showToast("Document uploaded", "success");
    } catch (err) {
      console.error(err);
      showToast("Could not connect to backend", "error");
    }
  };

  const handleDeleteClick = (doc) => {
    setDocToDelete(doc);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!docToDelete) return;

    try {
      await fetch(`${API_BASE}/patients/${patientId}/documents/${docToDelete.id}`, {
        method: "DELETE",
      });

      setDocuments((prev) => prev.filter((d) => d.id !== docToDelete.id));
      showToast("Document deleted", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete document", "error");
    } finally {
      setDocToDelete(null);
      setConfirmOpen(false);
    }
  };

  const openPreview = (doc) => {
    setPreviewDoc(doc);
    setPreviewOpen(true);
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
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={() => navigate("/patients")} className="secondary-button">
              ← Back to Patients
            </button>

            <div>
              <h1 className="page-title">Patient Profile</h1>
              <p className="page-subtitle">Comprehensive view of patient information and history</p>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="tabs-row">
          <button className="tab-btn" onClick={() => navigate(`/patients/${patientId}`)}>
            General Info
          </button>

          <button className="tab-btn" onClick={() => navigate(`/patients/${patientId}/appointments`)}>
            Appointments
          </button>

          <button className="tab-btn" onClick={() => navigate(`/patients/${patientId}/treatment-plans`)}>
            Treatment Plans
          </button>

          <button className="tab-btn active">Medical Records</button>

          <button className="tab-btn" onClick={() => navigate(`/patients/${patientId}/prescriptions`)}>
            Prescriptions
          </button>

          <button className="tab-btn" onClick={() => navigate(`/patients/${patientId}/invoices`)}>
            Invoices/Payments
          </button>
        </div>

        {/* Medical History */}
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Medical History</h2>
            {!isEditingHistory && (
              <button className="pill-button" onClick={() => setIsEditingHistory(true)}>
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
                  onChange={(e) => handleHistoryChange("pastDiagnoses", e.target.value)}
                  placeholder="Past diagnoses"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Allergies</label>
                <input
                  value={medicalHistory.allergies}
                  onChange={(e) => handleHistoryChange("allergies", e.target.value)}
                  placeholder="Allergies"
                />
              </div>

              <div className="form-group">
                <label>Medications</label>
                <textarea
                  value={medicalHistory.medications}
                  onChange={(e) => handleHistoryChange("medications", e.target.value)}
                  placeholder="Medications"
                  rows="3"
                />
              </div>

              <div className="history-actions">
                <button type="button" className="secondary-button" onClick={() => setIsEditingHistory(false)}>
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
                <strong>Past Diagnoses:</strong> {medicalHistory.pastDiagnoses || "—"}
              </p>
              <p>
                <strong>Allergies:</strong> {medicalHistory.allergies || "—"}
              </p>
              <p>
                <strong>Medications:</strong> {medicalHistory.medications || "—"}
              </p>
            </div>
          )}
        </section>

        {/* Documents */}
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Relevant Documents</h2>
            <button className="pill-button" onClick={() => setShowAddDoc(!showAddDoc)}>
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
                  onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Document Type</label>
                <select value={newDoc.type} onChange={(e) => setNewDoc({ ...newDoc, type: e.target.value })}>
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
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td>{doc.name}</td>
                  <td>{doc.type === "pdf" ? "PDF" : "Image"}</td>
                  <td className="actions-cell">
                    <button className="action-link" onClick={() => openPreview(doc)}>
                      View
                    </button>
                    <span className="separator">|</span>
                    <button className="action-link delete-link" onClick={() => handleDeleteClick(doc)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {documents.length === 0 && (
                <tr>
                  <td colSpan="3" className="no-data">
                    No documents available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Popups */}
        <ToastPopup open={toast.open} message={toast.message} type={toast.type} onClose={() => setToast((t) => ({ ...t, open: false }))} />

        <ConfirmPopup
          open={confirmOpen}
          title="Delete Document"
          message="Are you sure you want to delete this document? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          onCancel={() => {
            setConfirmOpen(false);
            setDocToDelete(null);
          }}
          onConfirm={confirmDelete}
        />

        <PreviewPopup
          open={previewOpen}
          doc={previewDoc}
          onClose={() => {
            setPreviewOpen(false);
            setPreviewDoc(null);
          }}
        />
      </main>
    </div>
  );
}
