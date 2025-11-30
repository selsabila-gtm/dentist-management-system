// src/App.jsx
<<<<<<< HEAD
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import StaffListPage from "./pages/staff/list.jsx";
import StaffAddPage from "./pages/staff/add.jsx";
import LoginPage from "./pages/staff/login";
import ResetPasswordPage from "./pages/staff/resetPassword";
import ChangePasswordPage from "./pages/staff/changePassword.jsx";
import StaffProfilePage from "./pages/staff/profile.jsx";
=======
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Patient pages
import MedicalRecordsPage from "./pages/patients/MedicalRecords.jsx";
import PrescriptionsPage from "./pages/patients/Prescriptions.jsx";
import TreatmentPlansPage from "./pages/patients/TreatmentPlans.jsx";

import "./App.css";
>>>>>>> a1dd83e2606c2cf848831384c559b1bb3c5b41a7

function App() {
  return (
    <BrowserRouter>
      <Routes>
<<<<<<< HEAD
        {/* redirect home to /staff for now */}
        <Route path="/" element={<Navigate to="/staff" />} />

        {/* staff management */}
        <Route path="/staff" element={<StaffListPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/staff/add" element={<StaffAddPage />} />
        <Route path="/staff/:id" element={<StaffProfilePage />} />
        <Route path="/staff/:id/password" element={<ChangePasswordPage />} />  {/* NEW */}
        <Route path="/login" element={<LoginPage />} />
=======
        {/* Default: go to medical records */}
        <Route
          path="/"
          element={<Navigate to="/patients/medical-records" replace />}
        />

        {/* Patient profile tabs */}
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

        {/* Fallback: anything unknown goes to medical records */}
        <Route
          path="*"
          element={<Navigate to="/patients/medical-records" replace />}
        />
>>>>>>> a1dd83e2606c2cf848831384c559b1bb3c5b41a7
      </Routes>
    </BrowserRouter>
  );
}

export default App;
