// src/pages/patients/Prescriptions.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./patientProfile.css";
import Sidebar from "../../components/sidebar/sidebar.jsx";

const API_BASE = "http://localhost:5000/api";

/* ------------------- TOAST POPUP ------------------- */
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

/* ------------------- CONFIRM MODAL ------------------- */
function ConfirmPopup({ open, title, message, confirmText = "Delete", onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div className="confirm-backdrop">
      <div className="confirm-modal">
        <h3 className="confirm-title">{title}</h3>
        <p className="confirm-message">{message}</p>

        <div className="confirm-actions">
          <button className="secondary-button" onClick={onCancel}>
            Cancel
          </button>
          <button className="danger-button" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PrescriptionsPage() {
  const navigate = useNavigate();
  const { patientId } = useParams();

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [toast, setToast] = useState({ open: false, message: "", type: "success" });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null); // store prescription object

  const [form, setForm] = useState({
    medication: "",
    dosage: "",
    frequency: "",
    date_issued: "",
    prescribing_dentist: "",
  });

  const showToast = (message, type = "success") => {
    setToast({ open: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, open: false })), 2500);
  };

  useEffect(() => {
    async function loadPrescriptions() {
      try {
        setLoading(true);

        const res = await fetch(`${API_BASE}/patients/${patientId}/prescriptions`);
        const data = await res.json();

        if (!res.ok) {
          console.error("Failed to load prescriptions", data);
          showToast(data.error || "Could not load prescriptions.", "error");
          return;
        }

        setPrescriptions(data);
      } catch (err) {
        console.error(err);
        showToast("Could not connect to backend.", "error");
      } finally {
        setLoading(false);
      }
    }

    if (patientId) loadPrescriptions();
  }, [patientId]);

  const openAddModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setForm({
      medication: "",
      dosage: "",
      frequency: "",
      date_issued: "",
      prescribing_dentist: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (prescription) => {
    setIsEditing(true);
    setEditingId(prescription.id);
    setForm({
      medication: prescription.medication || "",
      dosage: prescription.dosage || "",
      frequency: prescription.frequency || "",
      date_issued: prescription.date_issued || "",
      prescribing_dentist: prescription.prescribing_dentist || "",
    });
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { medication, dosage, frequency, date_issued, prescribing_dentist } = form;

    if (!medication || !dosage || !frequency || !date_issued || !prescribing_dentist) {
      showToast("Please fill in all fields.", "error");
      return;
    }

    try {
      if (isEditing && editingId != null) {
        // PUT update
        const res = await fetch(`${API_BASE}/prescriptions/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          console.error("Failed to update prescription", data);
          showToast(data.error || "Failed to update prescription.", "error");
          return;
        }

        setPrescriptions((prev) =>
          prev.map((p) => (p.id === editingId ? data.prescription : p))
        );

        showToast("Prescription updated.", "success");
      } else {
        // POST create
        const res = await fetch(`${API_BASE}/patients/${patientId}/prescriptions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          console.error("Failed to add prescription", data);
          showToast(data.error || "Failed to add prescription.", "error");
          return;
        }

        setPrescriptions((prev) => [...prev, data.prescription]);
        showToast("Prescription added.", "success");
      }

      setModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast("Could not connect to backend.", "error");
    }
  };

  // ---------- DELETE ----------
  const askDelete = (prescription) => {
    setPendingDelete(prescription);
    setConfirmOpen(true);
  };

  const cancelDelete = () => {
    setConfirmOpen(false);
    setPendingDelete(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    try {
      const res = await fetch(`${API_BASE}/prescriptions/${pendingDelete.id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showToast(data.error || "Failed to delete prescription.", "error");
        return;
      }

      setPrescriptions((prev) => prev.filter((p) => p.id !== pendingDelete.id));
      showToast("Prescription deleted.", "success");
    } catch (err) {
      console.error(err);
      showToast("Could not connect to backend.", "error");
    } finally {
      setConfirmOpen(false);
      setPendingDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <p>Loading prescriptions...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <header className="page-header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={() => navigate("/patients")} className="secondary-button">
              ← Back to Patients
            </button>

            <div>
              <h1 className="page-title">Patient Profile</h1>
              <p className="page-subtitle">View and manage patient information</p>
            </div>
          </div>
        </header>

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
          <button className="tab-btn" onClick={() => navigate(`/patients/${patientId}/medical-records`)}>
            Medical Records
          </button>
          <button className="tab-btn active">Prescriptions</button>
          <button className="tab-btn" onClick={() => navigate(`/patients/${patientId}/invoices`)}>
            Invoices/Payments
          </button>
        </div>

        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Prescriptions</h2>
            <button className="pill-button" type="button" onClick={openAddModal}>
              Add Medication
            </button>
          </div>

          <div className="table-wrapper">
            <table className="records-table">
              <thead>
                <tr>
                  <th>Medication</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                  <th>Date Issued</th>
                  <th>Prescribing Dentist</th>
                  <th style={{ width: "140px" }}></th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map((p) => (
                  <tr key={p.id}>
                    <td>{p.medication}</td>
                    <td className="link-like">{p.dosage}</td>
                    <td>{p.frequency}</td>
                    <td>{p.date_issued}</td>
                    <td>{p.prescribing_dentist}</td>
                    <td style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <button type="button" className="table-edit-button" onClick={() => openEditModal(p)}>
                        Edit
                      </button>
                      <button type="button" className="table-delete-button" onClick={() => askDelete(p)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {prescriptions.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ color: "#6b7280" }}>
                      No prescriptions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3 className="modal-title">{isEditing ? "Edit Prescription" : "Add Medication"}</h3>

            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="modal-row">
                <input
                  type="text"
                  className="add-doc-input"
                  placeholder="Medication"
                  value={form.medication}
                  onChange={(e) => handleChange("medication", e.target.value)}
                />
              </div>

              <div className="modal-row">
                <input
                  type="text"
                  className="add-doc-input"
                  placeholder="Dosage (e.g. 500mg)"
                  value={form.dosage}
                  onChange={(e) => handleChange("dosage", e.target.value)}
                />
              </div>

              <div className="modal-row">
                <input
                  type="text"
                  className="add-doc-input"
                  placeholder="Frequency (e.g. Three times a day)"
                  value={form.frequency}
                  onChange={(e) => handleChange("frequency", e.target.value)}
                />
              </div>

              <div className="modal-row">
                <input
                  type="date"
                  className="add-doc-input"
                  value={form.date_issued}
                  onChange={(e) => handleChange("date_issued", e.target.value)}
                />
              </div>

              <div className="modal-row">
                <input
                  type="text"
                  className="add-doc-input"
                  placeholder="Prescribing Dentist"
                  value={form.prescribing_dentist}
                  onChange={(e) => handleChange("prescribing_dentist", e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  {isEditing ? "Save Changes" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Popup */}
      <ConfirmPopup
        open={confirmOpen}
        title="Delete prescription?"
        message={
          pendingDelete
            ? `Are you sure you want to delete "${pendingDelete.medication}"?`
            : "Are you sure?"
        }
        confirmText="Delete"
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
      />

      {/* Toast */}
      <ToastPopup
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </div>
  );
}
