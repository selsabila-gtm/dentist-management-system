// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

// Staff pages
import StaffListPage from "./pages/staff/list.jsx";
import StaffAddPage from "./pages/staff/add.jsx";
import LoginPage from "./pages/staff/login";
import ResetPasswordPage from "./pages/staff/resetPassword";
import ChangePasswordPage from "./pages/staff/changePassword.jsx";
import StaffProfilePage from "./pages/staff/profile.jsx";

// Patient pages
import MedicalRecordsPage from "./pages/patients/MedicalRecords.jsx";
import PrescriptionsPage from "./pages/patients/Prescriptions.jsx";
import TreatmentPlansPage from "./pages/patients/TreatmentPlans.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home: redirect to staff list (change to patients if you want) */}
        <Route path="/" element={<Navigate to="/staff" replace />} />

        {/* Staff management */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/staff" element={<StaffListPage />} />
        <Route path="/staff/add" element={<StaffAddPage />} />
        <Route path="/staff/:id" element={<StaffProfilePage />} />
        <Route
          path="/staff/:id/password"
          element={<ChangePasswordPage />}
        />

        {/* Patient pages */}
        <Route
          path="/patients/medical-records"
          element={<MedicalRecordsPage />}
        />
        <Route
          path="/patients/prescriptions"
          element={<PrescriptionsPage />}
        />
        <Route
          path="/patients/treatment-plans"
          element={<TreatmentPlansPage />}
        />

        {/* Fallback: unknown routes -> staff */}
        <Route path="*" element={<Navigate to="/staff" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
