import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./add.css";
import Sidebar from "../../components/sidebar/sidebar"; 

const API_BASE = "http://127.0.0.1:5000";

export default function AddAppointment() {
  const navigate = useNavigate();
  const location = useLocation();

  const query = new URLSearchParams(location.search);
  const preselectedDate = query.get("date") || "";

  // ✅ GET CURRENT USER INFO from currentUser object
  const getCurrentUser = () => {
    try {
      const userStr = localStorage.getItem("currentUser");
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error("Error parsing currentUser:", error);
      return null;
    }
  };

  const currentUser = getCurrentUser();
  const staffId = currentUser?.id;
  const userRole = currentUser?.role_name;

  // State declarations
  const [patients, setPatients] = useState([]);
  const [dentists, setDentists] = useState([]);

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
  const [loadingDentistInfo, setLoadingDentistInfo] = useState(false);

  const procedureOptions = [
    "Routine",
    "Pain or Emergency",
    "Tooth Replacement",
    "Gum & Deep Cleaning",
    "Surgical Procedures",
    "Orthodontics",
  ];

  // Helper function to convert 12-hour time to 24-hour
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

  // Load patients and dentists on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/patients`)
      .then((res) => res.json())
      .then((data) => setPatients(data))
      .catch((err) => console.error("Error loading patients:", err));

    fetch(`${API_BASE}/api/staff/dentists`)
      .then((res) => res.json())
      .then((data) => setDentists(data))
      .catch((err) => console.error("Error loading dentists:", err));
  }, []);

  // ✅ AUTO-ASSIGN DENTIST IF USER IS DENTIST
  useEffect(() => {
    if (userRole === "Dentist" && staffId && dentists.length > 0) {
      const currentDentist = dentists.find(d => d.id === parseInt(staffId));
      if (currentDentist) {
        setDentist(currentDentist.name);
        setDentistId(String(staffId));
      }
    }
  }, [userRole, staffId, dentists]);

  // ✅ FETCH DENTIST AVAILABILITY FROM BACKEND when dentistId changes
  useEffect(() => {
    if (!dentistId) {
      // Reset to defaults when no dentist selected
      setAvailableDays([]);
      setAvailableTimeRange({ start: "08:30", end: "17:00" });
      return;
    }

    // Fetch dentist availability from backend
    setLoadingDentistInfo(true);
    fetch(`${API_BASE}/api/appointments/dentist/${dentistId}/availability`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch dentist availability");
        }
        return res.json();
      })
      .then((dentistData) => {
        console.log("=== DENTIST DATA FROM BACKEND ===");
        console.log("Full response:", dentistData);
        console.log("hours field:", dentistData.hours);
        console.log("days_available field:", dentistData.days_available);

        // Parse available days
        let newDays = [];
        if (dentistData.days_available) {
          newDays = dentistData.days_available.split(",").map(d => d.trim());
        } else {
          // Default days if not specified
          newDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Saturday"];
        }

        // Parse available hours
        let newTimeRange = { start: "08:30", end: "17:00" };
        
        console.log("Checking if hours exist:", dentistData.hours);
        
        if (dentistData.hours && dentistData.hours.trim() !== "") {
          console.log("Hours found, parsing:", dentistData.hours);
          // Try to match format like "9:00 AM - 5:00 PM" or "9:00 AM – 5:00 PM" (with en dash)
          // Updated regex to handle -, –, —, and multiple spaces
          let hoursMatch = dentistData.hours.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*[-–—]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
          
          if (hoursMatch) {
            const startTime = convertTo24Hour(`${hoursMatch[1]}:${hoursMatch[2]}`, hoursMatch[3]);
            const endTime = convertTo24Hour(`${hoursMatch[4]}:${hoursMatch[5]}`, hoursMatch[6]);
            newTimeRange = { start: startTime, end: endTime };
            console.log("Parsed 12-hour format:", newTimeRange);
          } else {
            // Try 24-hour format like "08:30 - 17:00" or "08:30 – 17:00"
            hoursMatch = dentistData.hours.match(/(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})/);
            if (hoursMatch) {
              const startTime = `${hoursMatch[1].padStart(2, '0')}:${hoursMatch[2]}`;
              const endTime = `${hoursMatch[3].padStart(2, '0')}:${hoursMatch[4]}`;
              newTimeRange = { start: startTime, end: endTime };
              console.log("Parsed 24-hour format:", newTimeRange);
            } else {
              console.log("Could not parse hours format:", dentistData.hours);
            }
          }
        } else {
          console.log("No hours set in database, using defaults");
        }

        setAvailableDays(newDays);
        setAvailableTimeRange(newTimeRange);
        setLoadingDentistInfo(false);

        console.log("Parsed availability:", {
          days: newDays,
          timeRange: newTimeRange
        });
      })
      .catch((err) => {
        console.error("Error loading dentist availability:", err);
        // Set defaults on error
        setAvailableDays(["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Saturday"]);
        setAvailableTimeRange({ start: "08:30", end: "17:00" });
        setLoadingDentistInfo(false);
      });
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
      setDentistId(String(selectedDentist.id));
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

  // ✅ ADD THIS LINE - Find the patient_id from the selected patient name
  const selectedPatient = patients.find(p => p.name === patient);

  const payload = {
    patient,
    patient_id: selectedPatient?.id,  // ✅ ADD THIS LINE
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
                  {dentist}
                </div>
              </>
            )}

            {/* ✅ SHOW AVAILABILITY INFO */}
            {dentistId && !loadingDentistInfo && availableDays.length > 0 && (
              <div className="availability-info">
                Available: {availableDays.join(", ")} • {availableTimeRange.start} - {availableTimeRange.end}
              </div>
            )}

            {loadingDentistInfo && (
              <div className="availability-info">
                Loading dentist availability...
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
              disabled={!dentistId || loadingDentistInfo}
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
              disabled={!dentistId || loadingDentistInfo}
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