// src/components/patients/PatientProfileTabs.jsx
import { NavLink } from "react-router-dom";
import "./tabs.css"; // you can change this

export default function PatientProfileTabs() {
  const tabs = [
    { label: "General Info", to: "/patients/profile" },
    { label: "Appointments", to: "/patients/appointments" },
    { label: "Treatment Plans", to: "/patients/treatment-plans" },
    { label: "Medical Records", to: "/patients/medical-records" },
    { label: "Prescriptions", to: "/patients/prescriptions" },
    { label: "Invoices/Payments", to: "/patients/invoices" },
  ];

  return (
    <div className="tabs-row">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            "tab-btn" + (isActive ? " active" : "")
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
