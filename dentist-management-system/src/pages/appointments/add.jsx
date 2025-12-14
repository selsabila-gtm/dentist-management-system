import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./add.css";
import Sidebar from "../../components/Sidebar/Sidebar"; 

const API_BASE = "http://127.0.0.1:5000";

export default function AddAppointment() {
  const navigate = useNavigate();
  const location = useLocation();

  const query = new URLSearchParams(location.search);
  const preselectedDate = query.get("date") || "";

  // ✅ GET CURRENT USER INFO
  const staffId = localStorage.getItem("staff_id");
  const userRole = localStorage.getItem("role");


  // State declarations
  const [patients, setPatients] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [allStaff, setAllStaff] = useState([]);

  const [patient, setPatient] = useState("");
  const [date, setDate] = useState(preselectedDate);
  const [time, setTime] = useState("");
  const [dentist, setDentist] = useState("");
  const [dentistId, setDentistId] = useState("");
  const [procedure, setProcedure] = useState("");
  const [notes, setNotes] = useState("");

  // Validation errors
  const [errors, setErrors] = useState({});

  // Dentist availability states
  const [availableDays, setAvailableDays] = useState([]);
  const [availableTimeRange, setAvailableTimeRange] = useState({
    start: "08:30",
    end: "17:00"
  });

  const procedureOptions = [
    "Routine",
    "Pain or Emergency",
    "Tooth Replacement",
    "Gum & Deep Cleaning",
    "Surgical Procedures",
    "Orthodontics",
  ];

  // Helper function
  function convertTo24Hour(time, period) {
    if (!time) return "08:30";
    
    let [hours, minutes] = time.split(':');
    hours = parseInt(hours);
    
    if (!minutes) minutes = "00";
    
    if (!period) {
      return `${String(hours).padStart(2, '0')}:${minutes}`;
    }
    
    if (period.toUpperCase() === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }

  useEffect(() => {
    fetch(`${API_BASE}/api/patients`)
      .then((res) => res.json())
      .then((data) => setPatients(data));

    fetch(`${API_BASE}/api/staff/dentists`)
      .then((res) => res.json())
      .then((data) => setDentists(data));

    fetch(`${API_BASE}/api/staff`)
      .then((res) => res.json())
      .then((data) => setAllStaff(data));
  }, []);

  // ✅ AUTO-ASSIGN DENTIST IF USER IS DENTIST
  useEffect(() => {
    if (userRole === "Dentist" && staffId && allStaff.length > 0) {
      const currentDentist = allStaff.find(s => s.id === parseInt(staffId));
      if (currentDentist) {
        const fullName = currentDentist.full_name || 
                        `${currentDentist.first_name || ''} ${currentDentist.last_name || ''}`.trim();
        setDentist(fullName);
        setDentistId(staffId);
      }
    }
  }, [userRole, staffId, allStaff]);

  // Update available days when dentist changes
  useEffect(() => {
    if (!dentistId || allStaff.length === 0) {
      if (availableDays.length > 0) setAvailableDays([]);
      if (availableTimeRange.start !== "08:30" || availableTimeRange.end !== "17:00") {
        setAvailableTimeRange({ start: "08:30", end: "17:00" });
      }
      return;
    }

    const selectedStaff = allStaff.find(s => s.id === parseInt(dentistId));
    if (!selectedStaff) return;

    let newDays = [];
    if (selectedStaff.days_available) {
      newDays = selectedStaff.days_available.split(",").map(d => d.trim());
    } else {
      newDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Saturday"];
    }

    let newTimeRange = { start: "08:30", end: "17:00" };
    
    if (selectedStaff.hours) {
      let hoursMatch = selectedStaff.hours.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      
      if (hoursMatch) {
        const startTime = convertTo24Hour(`${hoursMatch[1]}:${hoursMatch[2]}`, hoursMatch[3]);
        const endTime = convertTo24Hour(`${hoursMatch[4]}:${hoursMatch[5]}`, hoursMatch[6]);
        newTimeRange = { start: startTime, end: endTime };
      } else {
        hoursMatch = selectedStaff.hours.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
        if (hoursMatch) {
          const startTime = `${hoursMatch[1].padStart(2, '0')}:${hoursMatch[2]}`;
          const endTime = `${hoursMatch[3].padStart(2, '0')}:${hoursMatch[4]}`;
          newTimeRange = { start: startTime, end: endTime };
        }
      }
    }

    setAvailableDays(newDays);
    setAvailableTimeRange(newTimeRange);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dentistId]);

  function validateForm() {
    const newErrors = {};

    // Patient validation
    if (!patient) {
      newErrors.patient = "Patient is required";
    }

    // Dentist validation
    if (!dentist) {
      newErrors.dentist = "Dentist/Staff is required";
    }

    // Date validation
    if (!date) {
      newErrors.date = "Date is required";
    } else {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors.date = "Cannot schedule appointments in the past";
      } else {
        const dayOfWeek = selectedDate.getDay();
        if (dayOfWeek === 5) {
          newErrors.date = "Cannot schedule appointments on Fridays";
        } else if (dentistId && availableDays.length > 0) {
          const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
          const selectedDay = dayNames[dayOfWeek];
          
          if (!availableDays.includes(selectedDay)) {
            newErrors.date = `Selected dentist is not available on ${selectedDay}`;
          }
        }
      }
    }

    // Time validation
    if (!time) {
      newErrors.time = "Time is required";
    } else {
      const [hours, minutes] = time.split(':').map(Number);
      const timeInMinutes = hours * 60 + minutes;
      
      const [startHours, startMinutes] = availableTimeRange.start.split(':').map(Number);
      const startInMinutes = startHours * 60 + startMinutes;
      
      const [endHours, endMinutes] = availableTimeRange.end.split(':').map(Number);
      const endInMinutes = endHours * 60 + endMinutes;

      if (timeInMinutes < startInMinutes || timeInMinutes > endInMinutes) {
        const formatTime = (h, m) => {
          const period = h >= 12 ? 'PM' : 'AM';
          const displayHour = h % 12 || 12;
          return `${displayHour}:${String(m).padStart(2, '0')} ${period}`;
        };
        
        const startDisplay = formatTime(startHours, startMinutes);
        const endDisplay = formatTime(endHours, endMinutes);
        
        newErrors.time = `Time must be between ${startDisplay} and ${endDisplay}`;
      }
    }

    // Procedure validation
    if (!procedure) {
      newErrors.procedure = "Procedure type is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleDentistChange(e) {
    const selectedName = e.target.value;
    setDentist(selectedName);
    
    const selectedDentist = dentists.find(d => d.name === selectedName);
    if (selectedDentist) {
      setDentistId(selectedDentist.id);
    } else {
      setDentistId("");
    }
    
    setDate("");
    setTime("");
    
    // Clear related errors
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.dentist;
      delete newErrors.date;
      delete newErrors.time;
      return newErrors;
    });
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Convert 24-hour time to 12-hour format for display
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    const displayTime = `${displayHour}:${minutes} ${ampm}`;

    const payload = {
      patient,
      date,
      time: displayTime,
      dentist,
      dentist_id: dentistId,
      procedure,
      notes,
      cost: 0.0,
    };

    fetch(`${API_BASE}/api/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then(() => navigate("/calendar"))
      .catch(() => {
        setErrors({ submit: "Failed to save appointment. Please try again." });
      });
  }

  // ✅ CHECK IF DENTIST ROLE (for hiding dentist selector)
  const isDentistRole = userRole === "Dentist";

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page add-page">
        <div className="add-card">
          <h1 className="add-title">Add New Appointment</h1>

          <form className="add-form" onSubmit={handleSubmit}>

            {/* PATIENT */}
            <label className="add-label">Patient *</label>
            <select
              className={`add-select ${errors.patient ? 'error' : ''}`}
              value={patient}
              onChange={(e) => {
                if (e.target.value === "new") navigate("/patients/add");
                else {
                  setPatient(e.target.value);
                  setErrors(prev => ({ ...prev, patient: undefined }));
                }
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
            {errors.patient && <div className="error-message">{errors.patient}</div>}

            {/* ✅ DENTIST - HIDDEN IF USER IS DENTIST */}
            {!isDentistRole && (
              <>
                <label className="add-label">Dentist/Staff *</label>
                <select
                  className={`add-select ${errors.dentist ? 'error' : ''}`}
                  value={dentist}
                  onChange={handleDentistChange}
                >
                  <option value="">Select Dentist/Staff</option>
                  {dentists.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
                {errors.dentist && <div className="error-message">{errors.dentist}</div>}
              </>
            )}

            {/* ✅ SHOW ASSIGNED DENTIST INFO IF DENTIST ROLE */}
            {isDentistRole && dentist && (
              <>
                <label className="add-label">Dentist *</label>
                <div style={{ 
                  padding: '12px 16px', 
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  color: '#334155',
                  fontSize: '15px'
                }}>
                  Dr. {dentist.replace(/^Dr\.\s*/i, '')}
                </div>
              </>
            )}

            {dentistId && availableDays.length > 0 && (
              <div className="availability-info">
                Available: {availableDays.join(", ")} • {availableTimeRange.start} - {availableTimeRange.end}
              </div>
            )}

            {/* DATE */}
            <label className="add-label">Date *</label>
            <input
              type="date"
              className={`add-input ${errors.date ? 'error' : ''}`}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setErrors(prev => ({ ...prev, date: undefined }));
              }}
              disabled={!dentistId}
              min={new Date().toISOString().split('T')[0]}
            />
            {errors.date && <div className="error-message">{errors.date}</div>}

            {/* TIME */}
            <label className="add-label">Time *</label>
            <input
              type="time"
              className={`add-input ${errors.time ? 'error' : ''}`}
              value={time}
              onChange={(e) => {
                setTime(e.target.value);
                setErrors(prev => ({ ...prev, time: undefined }));
              }}
              disabled={!dentistId}
            />
            {errors.time && <div className="error-message">{errors.time}</div>}

            {/* PROCEDURE TYPE */}
            <label className="add-label">Procedure Type *</label>
            <select
              className={`add-select ${errors.procedure ? 'error' : ''}`}
              value={procedure}
              onChange={(e) => {
                setProcedure(e.target.value);
                setErrors(prev => ({ ...prev, procedure: undefined }));
              }}
            >
              <option value="">Select Procedure Type</option>
              {procedureOptions.map((proc) => (
                <option key={proc} value={proc}>
                  {proc}
                </option>
              ))}
            </select>
            {errors.procedure && <div className="error-message">{errors.procedure}</div>}

            {/* NOTES */}
            <label className="add-label">Notes (Optional)</label>
            <textarea
              className="add-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
            />

            {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}

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
    </div>
  );
}