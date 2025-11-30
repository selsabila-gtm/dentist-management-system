// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Patient pages
import MedicalRecordsPage from "./pages/patients/MedicalRecords.jsx";
import PrescriptionsPage from "./pages/patients/Prescriptions.jsx";
import TreatmentPlansPage from "./pages/patients/TreatmentPlans.jsx";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
