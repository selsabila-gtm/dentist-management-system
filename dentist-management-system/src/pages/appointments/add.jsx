import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./add.css";
import Sidebar from "../../components/Sidebar/Sidebar"; 

const API_BASE = "http://127.0.0.1:5000";

export default function AddAppointment() {
  const navigate = useNavigate();
  const location = useLocation();

  // extract date from URL
  const query = new URLSearchParams(location.search);
  const preselectedDate = query.get("date") || "";

  // form fields
  const [patients, setPatients] = useState([]);
  const [dentists, setDentists] = useState([]);

  const [patient, setPatient] = useState("");
  const [date, setDate] = useState(preselectedDate);
  const [time, setTime] = useState("");
  const [dentist, setDentist] = useState("");
  const [procedure, setProcedure] = useState("");
  const [notes, setNotes] = useState("");


  const procedureOptions = [
    "Routine",
    "Pain or Emergency",
    "Tooth Replacement",
    "Gum & Deep Cleaning",
    "Surgical Procedures",
    "Orthodontics",
  ];

  // Load patients + dentists from backend
  useEffect(() => {
    fetch(`${API_BASE}/api/patients`)
      .then((res) => res.json())
      .then((data) => setPatients(data));

    fetch(`${API_BASE}/api/staff/dentists`)
      .then((res) => res.json())
      .then((data) => setDentists(data));
  }, []);

  function handleSubmit(e) {
    e.preventDefault();

    if (!patient || !date || !time || !dentist || !procedure) {
      alert("All fields except notes are required.");
      return;
    }

    const payload = {
      patient,
      date,
      time,
      dentist,
      procedure,
      notes,
    };

    fetch(`${API_BASE}/api/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then(() => navigate("/calendar"))
      .catch(() => alert("Failed to save appointment"));
  }

  return (
    <div className="app-layout">
      <Sidebar />
    <div className="page add-page">
      <h1 className="page-header">Add New Appointment</h1>

      <form className="add-form" onSubmit={handleSubmit}>
        {/* PATIENT */}
        <label className="add-label">Patient</label>
        <select
          className="add-select"
          value={patient}
          onChange={(e) => {
            if (e.target.value === "new") navigate("/patients/add");
            else setPatient(e.target.value);
          }}
        >
          <option value="">Select Patient</option>
          {patients.map((p) => (
            <option key={p.id} value={p.name}>
              {p.name}
            </option>
          ))}
          <option value="new">➕ Add New Patient</option>
        </select>

        {/* DATE */}
        <label className="add-label">Date</label>
        <input
          type="date"
          className="add-input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        {/* TIME */}
        <label className="add-label">Time</label>
        <input
          type="time"
          className="add-input"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />

        {/* DENTIST */}
        <label className="add-label">Dentist/Staff</label>
        <select
          className="add-select"
          value={dentist}
          onChange={(e) => setDentist(e.target.value)}
        >
          <option value="">Select Dentist/Staff</option>
          {dentists.map((d) => (
            <option key={d.id} value={d.name}>
              {d.name}
            </option>
          ))}
        </select>

        {/* PROCEDURE TYPE */}
        <label className="add-label">Procedure Type</label>
        <select
          className="add-select"
          value={procedure}
          onChange={(e) => setProcedure(e.target.value)}
        >
          <option value="">Select Procedure Type</option>
          {procedureOptions.map((proc) => (
            <option key={proc} value={proc}>
              {proc}
            </option>
          ))}
        </select>

        {/* NOTES */}
        <label className="add-label">Notes (Optional)</label>
        <textarea
          className="add-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {/* BUTTONS */}
        <div className="add-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/calendar")}
          >
            Cancel
          </button>

          <button type="submit" className="primary-button">
            Add Appointment
          </button>
        </div>
      </form>
    </div>
    </div>
  );
}

