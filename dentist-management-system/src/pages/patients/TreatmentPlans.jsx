// src/pages/patients/TreatmentPlans.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./patientProfile.css";

const API_BASE = "http://localhost:5000/api";
const PATIENT_ID = 1;

export default function TreatmentPlansPage() {
  const navigate = useNavigate();

  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    procedure: "",
    tooth: "",
    date: "",
    cost: "",
    status: "Proposed",
  });

  useEffect(() => {
    async function loadTreatments() {
      try {
        const res = await fetch(
          `${API_BASE}/patients/${PATIENT_ID}/treatments`
        );
        const data = await res.json();

        if (!res.ok) {
          console.error("Failed to load treatments", data);
          alert(data.error || "Could not load treatments.");
          return;
        }

        setTreatments(data);
      } catch (err) {
        console.error(err);
        alert("Could not connect to backend.");
      } finally {
        setLoading(false);
      }
    }

    loadTreatments();
  }, []);

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
      procedure: t.procedure,
      tooth: t.tooth || "",
      date: t.date,
      cost: t.cost,
      status: t.status,
    });
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { procedure, date, cost, status } = form;
    if (!procedure || !date || !cost || !status) {
      alert("Please fill in procedure, date, cost and status.");
      return;
    }

    try {
      if (isEditing && editingId != null) {
        const res = await fetch(`${API_BASE}/treatments/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        });

        const data = await res.json();
        if (!res.ok) {
          console.error("Failed to update treatment", data);
          alert(data.error || "Failed to update treatment.");
          return;
        }

        setTreatments((prev) =>
          prev.map((t) => (t.id === editingId ? data.treatment : t))
        );
        alert("Treatment updated.");
      } else {
        const res = await fetch(
          `${API_BASE}/patients/${PATIENT_ID}/treatments`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(form),
          }
        );

        const data = await res.json();
        if (!res.ok) {
          console.error("Failed to add treatment", data);
          alert(data.error || "Failed to add treatment.");
          return;
        }

        setTreatments((prev) => [...prev, data.treatment]);
        alert("Treatment added.");
      }

      setModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Could not connect to backend.");
    }
  };

  const proposed = treatments.filter((t) => t.status === "Proposed");
  const completed = treatments.filter((t) => t.status === "Completed");

  if (loading) {
    return (
      <div className="app-layout">
        <main className="main-content">
          <p>Loading treatment plans...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">

      {/* Main content */}
      <main className="main-content">
        <header className="page-header">
          <h1 className="page-title">Patient Profile</h1>
          <p className="page-subtitle">View and manage patient information</p>
        </header>

        <div className="tabs-row">
          <button className="tab-btn">General Info</button>
          <button className="tab-btn">Appointments</button>
          <button className="tab-btn active">Treatment Plans</button>
          <button
            className="tab-btn"
            onClick={() => navigate("/patients/medical-records")}
          >
            Medical Records
          </button>
          <button
            className="tab-btn"
            onClick={() => navigate("/patients/prescriptions")}
          >
            Prescriptions
          </button>
          <button className="tab-btn">Invoices/Payments</button>
        </div>

        {/* Proposed Treatments */}
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Proposed Treatments</h2>
            <button
              className="pill-button"
              type="button"
              onClick={openAddModal}
            >
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
                  <th style={{ width: "80px" }}></th>
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
                    <td>
                      <button
                        type="button"
                        className="table-edit-button"
                        onClick={() => openEditModal(t)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}

                {proposed.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ color: "#6b7280" }}>
                      No proposed treatments.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Completed Treatments */}
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
                  <th style={{ width: "80px" }}></th>
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
                    <td>
                      <button
                        type="button"
                        className="table-edit-button"
                        onClick={() => openEditModal(t)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}

                {completed.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ color: "#6b7280" }}>
                      No completed treatments.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Modal */}
      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3 className="modal-title">
              {isEditing ? "Edit Treatment" : "Add procedure"}
            </h3>
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="modal-row">
                <input
                  type="text"
                  className="add-doc-input"
                  placeholder="Procedure"
                  value={form.procedure}
                  onChange={(e) =>
                    handleChange("procedure", e.target.value)
                  }
                />
              </div>
              <div className="modal-row">
                <input
                  type="text"
                  className="add-doc-input"
                  placeholder="Tooth (e.g. Tooth #14)"
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
                  placeholder="Cost (e.g. 800)"
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
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
                >
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
    </div>
  );
}
