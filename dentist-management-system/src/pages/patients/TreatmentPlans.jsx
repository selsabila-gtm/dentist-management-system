// src/pages/patients/TreatmentPlans.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./patientProfile.css";
import Sidebar from "../../components/sidebar/sidebar.jsx";

const API_BASE = "/api";

/* ---------------- TOAST ---------------- */
function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className={`toast toast-${toast.type}`}>
      <span>{toast.message}</span>
      <button className="toast-close" onClick={onClose}>
        ✕
      </button>
    </div>
  );
}

/* ---------------- CONFIRM MODAL ---------------- */
function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="confirm-backdrop" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-title">{title}</h3>
        <p className="confirm-message">{message}</p>

        <div className="confirm-actions">
          <button className="secondary-button" onClick={onCancel}>
            Cancel
          </button>
          <button className="primary-button" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TreatmentPlansPage() {
  const navigate = useNavigate();
  const { patientId } = useParams();

  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [toast, setToast] = useState(null);
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2600);
  };

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [form, setForm] = useState({
    procedure: "",
    tooth: "",
    date: "",
    cost: "",
    status: "Proposed",
  });

  const proposed = useMemo(
    () => treatments.filter((t) => t.status === "Proposed"),
    [treatments]
  );

  const completed = useMemo(
    () => treatments.filter((t) => t.status === "Completed"),
    [treatments]
  );

  /* ---------- LOAD ---------- */
  useEffect(() => {
    async function loadTreatments() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/patients/${patientId}/treatments`);
        const data = await res.json().catch(() => []);

        if (!res.ok) {
          showToast("error", data?.error || "Failed to load treatments.");
          return;
        }

        setTreatments(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        showToast("error", "Could not connect to backend.");
      } finally {
        setLoading(false);
      }
    }

    if (patientId) loadTreatments();
  }, [patientId]);

  /* ---------- MODAL ---------- */
  const openAddModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setForm({
      procedure: "",
      tooth: "",
      date: "",
      cost: "",
      status: "Proposed",
    });
    setModalOpen(true);
  };

  const openEditModal = (t) => {
    setIsEditing(true);
    setEditingId(t.id);
    setForm({
      procedure: t.procedure || "",
      tooth: t.tooth || "",
      date: t.date || "",
      cost: t.cost ?? "",
      status: t.status || "Proposed",
    });
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  /* ---------- SAVE ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const procedure = form.procedure?.trim();
    const tooth = form.tooth?.trim();
    const date = form.date;
    const status = form.status;

    const costValue = String(form.cost).trim();
    const cost = costValue === "" ? "" : Number(costValue);

    if (!procedure || !date || cost === "" || Number.isNaN(cost) || !status) {
      showToast("error", "Please fill in procedure, date, cost and status.");
      return;
    }

    const payload = { procedure, tooth, date, cost, status };

    try {
      if (isEditing && editingId != null) {
        const res = await fetch(`${API_BASE}/treatments/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          showToast("error", data.error || "Failed to update treatment.");
          return;
        }

        setTreatments((prev) =>
          prev.map((t) => (t.id === editingId ? data.treatment : t))
        );
        showToast("success", "Treatment updated.");
      } else {
        const res = await fetch(`${API_BASE}/patients/${patientId}/treatments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          showToast("error", data.error || "Failed to add treatment.");
          return;
        }

        setTreatments((prev) => [...prev, data.treatment]);
        showToast("success", "Treatment added.");
      }

      setModalOpen(false);
    } catch (e) {
      console.error(e);
      showToast("error", "Could not connect to backend.");
    }
  };

  /* ---------- DELETE ---------- */
  const requestDelete = (t) => {
    setDeleteTarget(t);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;

    try {
      const res = await fetch(`${API_BASE}/treatments/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        showToast("error", "Failed to delete treatment.");
        return;
      }

      setTreatments((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      showToast("success", "Treatment deleted.");
    } catch (e) {
      console.error(e);
      showToast("error", "Could not connect to backend.");
    } finally {
      setConfirmOpen(false);
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <p>Loading treatment plans...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Toast toast={toast} onClose={() => setToast(null)} />

        <ConfirmModal
          open={confirmOpen}
          title="Delete treatment?"
          message="This will permanently remove this treatment."
          onConfirm={confirmDelete}
          onCancel={() => setConfirmOpen(false)}
        />

        <header className="page-header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => navigate("/patients")}
              className="secondary-button"
            >
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
          <button className="tab-btn active">Treatment Plans</button>
          <button className="tab-btn" onClick={() => navigate(`/patients/${patientId}/medical-records`)}>
            Medical Records
          </button>
          <button className="tab-btn" onClick={() => navigate(`/patients/${patientId}/prescriptions`)}>
            Prescriptions
          </button>
          <button className="tab-btn" onClick={() => navigate(`/patients/${patientId}/invoices`)}>
            Invoices/Payments
          </button>
        </div>

        {/* Proposed */}
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Proposed Treatments</h2>
            <button className="pill-button" onClick={openAddModal}>
              Add procedure
            </button>
          </div>

          <div className="table-wrapper">
            <table className="records-table">
              <thead>
                <tr>
                  <th>Procedure</th>
                  <th>Tooth</th>
                  <th>Date</th>
                  <th>Cost</th>
                  <th>Status</th>
                  <th style={{ width: "140px" }}></th>
                </tr>
              </thead>
              <tbody>
                {proposed.map((t) => (
                  <tr key={t.id}>
                    <td>{t.procedure}</td>
                    <td className="link-like">{t.tooth}</td>
                    <td className="link-like">{t.date}</td>
                    <td className="link-like">{`$${t.cost}`}</td>
                    <td>
                      <span className="status-pill proposed">Proposed</span>
                    </td>
                    <td className="actions-cell">
                      <button className="table-edit-button" onClick={() => openEditModal(t)}>
                        Edit
                      </button>
                      <span className="separator">|</span>
                      <button className="action-link delete-link" onClick={() => requestDelete(t)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {proposed.length === 0 && (
                  <tr>
                    <td colSpan="6" className="no-data">
                      No proposed treatments.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Completed */}
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Completed Treatments</h2>
          </div>

          <div className="table-wrapper">
            <table className="records-table">
              <thead>
                <tr>
                  <th>Procedure</th>
                  <th>Tooth</th>
                  <th>Date</th>
                  <th>Cost</th>
                  <th>Status</th>
                  <th style={{ width: "140px" }}></th>
                </tr>
              </thead>
              <tbody>
                {completed.map((t) => (
                  <tr key={t.id}>
                    <td>{t.procedure}</td>
                    <td className="link-like">{t.tooth}</td>
                    <td className="link-like">{t.date}</td>
                    <td className="link-like">{`$${t.cost}`}</td>
                    <td>
                      <span className="status-pill completed">Completed</span>
                    </td>
                    <td className="actions-cell">
                      <button className="table-edit-button" onClick={() => openEditModal(t)}>
                        Edit
                      </button>
                      <span className="separator">|</span>
                      <button className="action-link delete-link" onClick={() => requestDelete(t)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {completed.length === 0 && (
                  <tr>
                    <td colSpan="6" className="no-data">
                      No completed treatments.
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
            <h3 className="modal-title">{isEditing ? "Edit Treatment" : "Add procedure"}</h3>

            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="modal-row">
                <input
                  className="add-doc-input"
                  placeholder="Procedure"
                  value={form.procedure}
                  onChange={(e) => handleChange("procedure", e.target.value)}
                />
              </div>

              <div className="modal-row">
                <input
                  className="add-doc-input"
                  placeholder="Tooth (optional)"
                  value={form.tooth}
                  onChange={(e) => handleChange("tooth", e.target.value)}
                />
              </div>

              <div className="modal-row">
                <input
                  type="date"
                  className="add-doc-input"
                  value={form.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                />
              </div>

              <div className="modal-row">
                <input
                  type="number"
                  className="add-doc-input"
                  placeholder="Cost (e.g. 200)"
                  value={form.cost}
                  onChange={(e) => handleChange("cost", e.target.value)}
                />
              </div>

              <div className="modal-row">
                <select
                  className="add-doc-input"
                  value={form.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                >
                  <option value="Proposed">Proposed</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  {isEditing ? "Save" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
