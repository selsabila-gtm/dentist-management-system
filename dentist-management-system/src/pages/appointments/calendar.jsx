import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./calendar.css";
import Sidebar from "../../components/Sidebar/Sidebar";

const API_BASE = "http://127.0.0.1:5000";
const CALENDAR_YEAR = 2025;

function formatDateKey(year, monthIndex, day) {
  const m = String(monthIndex + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function formatDisplayDate(dateKey) {
  if (!dateKey) return "";
  const [y, m, d] = dateKey.split("-");
  const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
  return dateObj.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function MonthView({
  year,
  monthIndex,
  selectedDateKey,
  onSelectDate,
  appointments,
}) {
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const monthLabel = new Date(year, monthIndex, 1).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" }
  );

  const today = new Date();
  const todayKey = formatDateKey(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  function getDayStatus(dateKey) {
    const dayAppointments = appointments.filter((appt) => appt.date === dateKey);

    if (dayAppointments.length === 0) {
      return null;
    }

    const allCompleted = dayAppointments.every(
      (appt) => appt.status === "completed"
    );
    const hasScheduled = dayAppointments.some(
      (appt) => appt.status === "scheduled"
    );

    if (allCompleted) {
      return "all-completed";
    } else if (hasScheduled) {
      return "has-scheduled";
    }
    return null;
  }

  const cells = [];
  for (let i = 0; i < 42; i++) {
    const dayNum = i - firstDay + 1;
    if (dayNum < 1 || dayNum > daysInMonth) {
      cells.push(null);
    } else {
      const key = formatDateKey(year, monthIndex, dayNum);
      const dayStatus = getDayStatus(key);
      const isToday = key === todayKey;

      cells.push({ dayNum, key, dayStatus, isToday });
    }
  }

  return (
    <div className="month-card">
      <div className="month-title">{monthLabel}</div>
      <div className="month-grid-header">
        {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="month-grid">
        {cells.map((cell, idx) =>
          cell ? (
            <button
              type="button"
              key={idx}
              className={
                "month-day" +
                (selectedDateKey === cell.key ? " selected" : "") +
                (cell.isToday ? " today" : "") +
                (cell.dayStatus === "has-scheduled" ? " has-scheduled" : "") +
                (cell.dayStatus === "all-completed" ? " all-completed" : "")
              }
              onClick={() => onSelectDate(cell.key)}
            >
              {cell.dayNum}
            </button>
          ) : (
            <div key={idx} />
          )
        )}
      </div>
    </div>
  );
}

export default function Calendar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [appointments, setAppointments] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  // ✅ GET CURRENT USER INFO
  const staffId = localStorage.getItem("staff_id");
  const userRole = localStorage.getItem("role");

  const today = new Date();
  const initialMonth =
    today.getFullYear() === CALENDAR_YEAR ? today.getMonth() : 10;

  const returnDate = location.state?.returnDate;
  
  const getInitialMonthIndex = () => {
    if (returnDate) {
      try {
        const [year, month] = returnDate.split("-").map(Number);
        if (year && month && month >= 1 && month <= 12) {
          return (year * 12) + (month - 1);
        }
      } catch (error) {
        console.error("Error parsing return date:", error);
      }
    }
    return CALENDAR_YEAR * 12 + initialMonth;
  };

  const [monthIndex, setMonthIndex] = useState(getInitialMonthIndex());
  
  const initialSelectedDateKey = returnDate || 
    (today.getFullYear() === CALENDAR_YEAR
      ? formatDateKey(CALENDAR_YEAR, initialMonth, today.getDate())
      : "2025-11-01");

  const [selectedDateKey, setSelectedDateKey] = useState(initialSelectedDateKey);

  function loadAppointments() {
    // ✅ BUILD API URL WITH DENTIST FILTER IF USER IS DENTIST
    let apiUrl = `${API_BASE}/api/appointments`;
    
    if (userRole === "Dentist" && staffId) {
      apiUrl += `?dentist_id=${staffId}`;
    }

    console.log("Loading appointments from:", apiUrl);
    console.log("User Role:", userRole, "Staff ID:", staffId);

    fetch(apiUrl)
      .then((res) => {
        console.log("Response status:", res.status);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Appointments loaded:", data);
        setAppointments(data);
        setErrorMessage(""); // Clear any previous errors
      })
      .catch((err) => {
        console.error("Error loading appointments:", err);
        setErrorMessage("Failed to load appointments.");
      });
  }

  function handleSelectDate(dateKey) {
    setSelectedDateKey(dateKey);
    setErrorMessage("");
  }

  useEffect(() => {
    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredAppointments = useMemo(() => {
    if (!selectedDateKey) return appointments;
    return appointments.filter((a) => a.date === selectedDateKey);
  }, [appointments, selectedDateKey]);

  const currentYear = Math.floor(monthIndex / 12);
  const currentMonth = monthIndex % 12;
  const secondIndex = monthIndex + 1;
  const secondYear = Math.floor(secondIndex / 12);
  const secondMonth = secondIndex % 12;

  function goNext() {
    setMonthIndex((prev) => prev + 2);
  }

  function goPrev() {
    setMonthIndex((prev) => prev - 2);
  }

  function handleAddAppointmentClick() {
    if (selectedDateKey) {
      const selectedDate = new Date(selectedDateKey);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        setErrorMessage("Cannot add appointments for past dates.");
        return;
      }
    }

    navigate(`/calendar/add?date=${selectedDateKey}`);
  }

  function handleStatusChange(appt, newStatus) {
    setErrorMessage("");

    if (appt.status !== "scheduled") {
      setErrorMessage("This appointment status is locked.");
      return;
    }

    if (newStatus === "completed") {
      navigate(`/calendar/post-summary/${appt.id}`, {
        state: { returnDate: selectedDateKey }
      });
      return;
    }

    if (newStatus === "cancelled") {
      fetch(`${API_BASE}/api/appointments/${appt.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || "Error updating status");
          }
          loadAppointments();
        })
        .catch((err) => {
          console.error(err);
          setErrorMessage(err.message);
        });
    }
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page calendar-page">
        <header className="page-header">
          <h1>Calendar</h1>
          <button
            className="primary-button pill-button"
            onClick={() => navigate("/calendar/add")}
          >
            New Appointment
          </button>
        </header>

        <section className="calendar-section">
          <button type="button" className="month-arrow" onClick={goPrev}>
            &lt;
          </button>

          <div className="calendar-months">
            <MonthView
              year={currentYear}
              monthIndex={currentMonth}
              selectedDateKey={selectedDateKey}
              onSelectDate={handleSelectDate}
              appointments={appointments}
            />
            <MonthView
              year={secondYear}
              monthIndex={secondMonth}
              selectedDateKey={selectedDateKey}
              onSelectDate={handleSelectDate}
              appointments={appointments}
            />
          </div>

          <button type="button" className="month-arrow" onClick={goNext}>
            &gt;
          </button>
        </section>

        <section className="appointments-section">
          <div className="appointments-header">
            <h2>Appointments</h2>

            <div className="appointments-date-label">
              {selectedDateKey && formatDisplayDate(selectedDateKey)} ·{" "}
              {filteredAppointments.length} appointment
              {filteredAppointments.length !== 1 ? "s" : ""}
            </div>

            <div>
              <button className="primary-button" onClick={handleAddAppointmentClick}>
                Add Appointment
              </button>
            </div>
          </div>

          {errorMessage && <div className="error-banner">{errorMessage}</div>}

          <div className="card">
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Patient</th>
                  <th>Dentist</th>
                  <th>Procedure</th>
                  <th>Status</th>
                  <th style={{ width: 180 }}>Change Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appt) => (
                  <tr key={appt.id}>
                    <td className="time-link">{appt.time}</td>
                    <td>{appt.patient}</td>
                    <td>{appt.dentist}</td>
                    <td className="link-text">{appt.procedure}</td>

                    <td className="status-cell">
                      <span className={`status-badge status-${appt.status}`}>
                        {appt.status}
                      </span>

                      <button
                        className={`link-button view-btn ${
                          appt.status === "completed" ? "" : "disabled"
                        }`}
                        disabled={appt.status !== "completed"}
                        onClick={() => 
                          navigate(`/calendar/post-summary/${appt.id}`, {
                            state: { returnDate: selectedDateKey }
                          })
                        }
                      >
                        View
                      </button>
                    </td>

                    <td>
                      <select
                        className="status-select"
                        value={appt.status}
                        onChange={(e) => handleStatusChange(appt, e.target.value)}
                      >
                        <option value="scheduled">scheduled</option>
                        <option value="completed">completed</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {filteredAppointments.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 16 }}>
                      No appointments on this date.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}