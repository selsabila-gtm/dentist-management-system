// src/pages/patients/Prescriptions.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./patientProfile.css";
import Sidebar from "../../components/sidebar/sidebar.jsx";

const API_BASE = "http://localhost:5000/api";
const PATIENT_ID = 1; // demo patient seeded in backend

export default function PrescriptionsPage() {
  const navigate = useNavigate();

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    medication: "",
    dosage: "",
    frequency: "",
    date_issued: "",
    prescribing_dentist: "",
  });

  useEffect(() => {
    async function loadPrescriptions() {
      try {
        const res = await fetch(
          `${API_BASE}/patients/${PATIENT_ID}/prescriptions`
        );
        const data = await res.json();

        if (!res.ok) {
          console.error("Failed to load prescriptions", data);
          alert(data.error || "Could not load prescriptions.");
          return;
        }

        setPrescriptions(data);
      } catch (err) {
        console.error(err);
        alert("Could not connect to backend.");
      } finally {
        setLoading(false);
      }
    }

    loadPrescriptions();
  }, []);

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
      medication: prescription.medication,
      dosage: prescription.dosage,
      frequency: prescription.frequency,
      date_issued: prescription.date_issued,
      prescribing_dentist: prescription.prescribing_dentist,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { medication, dosage, frequency, date_issued, prescribing_dentist } =
      form;

    if (
      !medication ||
      !dosage ||
      !frequency ||
      !date_issued ||
      !prescribing_dentist
    ) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      if (isEditing && editingId != null) {
        // PUT update
        const res = await fetch(`${API_BASE}/prescriptions/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        });

        const data = await res.json();
        if (!res.ok) {
          console.error("Failed to update prescription", data);
          alert(data.error || "Failed to update prescription.");
          return;
        }

        setPrescriptions((prev) =>
          prev.map((p) => (p.id === editingId ? data.prescription : p))
        );
        alert("Prescription updated.");
      } else {
        // POST create
        const res = await fetch(
          `${API_BASE}/patients/${PATIENT_ID}/prescriptions`,
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
          console.error("Failed to add prescription", data);
          alert(data.error || "Failed to add prescription.");
          return;
        }

        setPrescriptions((prev) => [...prev, data.prescription]);
        alert("Prescription added.");
      }

      setModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Could not connect to backend.");
    }
  };

  if (loading) {
    return (
      <div className="app-layout">
        <main className="main-content">
          <p>Loading prescriptions...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />

      {/* Main content */}
      <main className="main-content">
        <header className="page-header">
          <h1 className="page-title">Patient Profile</h1>
          <p className="page-subtitle">View and manage patient information</p>
        </header>

        <div className="tabs-row">
          <button className="tab-btn">General Info</button>
          <button className="tab-btn">Appointments</button>
          <button
            className="tab-btn"
            onClick={() => navigate("/patients/treatment-plans")}
          >
            Treatment Plans
          </button>
          <button
            className="tab-btn"
            onClick={() => navigate("/patients/medical-records")}
          >
            Medical Records
          </button>
          <button className="tab-btn active">Prescriptions</button>
          <button className="tab-btn">Invoices/Payments</button>
        </div>

        {/* Prescriptions card */}
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Prescriptions</h2>
            <button
              className="pill-button"
              type="button"
              onClick={openAddModal}
            >
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
                  <th style={{ width: "80px" }}></th>
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
                    <td>
                      <button
                        type="button"
                        className="table-edit-button"
                        onClick={() => openEditModal(p)}
                      >
                        Edit
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

      {/* Modal */}
      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3 className="modal-title">
              {isEditing ? "Edit Prescription" : "Add Medication"}
            </h3>
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
                  onChange={(e) =>
                    handleChange("date_issued", e.target.value)
                  }
                />
              </div>
              <div className="modal-row">
                <input
                  type="text"
                  className="add-doc-input"
                  placeholder="Prescribing Dentist"
                  value={form.prescribing_dentist}
                  onChange={(e) =>
                    handleChange("prescribing_dentist", e.target.value)
                  }
                />
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
