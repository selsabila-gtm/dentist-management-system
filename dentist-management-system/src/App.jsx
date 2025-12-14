// src/App.jsx

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Patient pages
import AddPatient from './pages/patients/AddPatient.jsx';
import Appointment from './pages/patients/PatientAppointment.jsx'; 
import PatientInvoices from './pages/patients/PatientInvoices.jsx';
import SearchPatient from './pages/patients/SearchPatient.jsx';
import ViewPatient from './pages/patients/ViewPatient.jsx';

import MedicalRecordsPage from "./pages/patients/MedicalRecords.jsx";
import PrescriptionsPage from "./pages/patients/Prescriptions.jsx";
import TreatmentPlansPage from "./pages/patients/TreatmentPlans.jsx";

// Staff pages
import StaffListPage from "./pages/staff/list.jsx";
import StaffAddPage from "./pages/staff/add.jsx";
import LoginPage from "./pages/staff/login";
import ResetPasswordPage from "./pages/staff/resetPassword";
import ChangePasswordPage from "./pages/staff/changePassword.jsx";
import StaffProfilePage from "./pages/staff/profile.jsx";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Patient Pages */}
        <Route path="/add-patient" element={<AddPatient />} />
        <Route path="/b" element={<Appointment />} /> 
        <Route path="/c" element={<PatientInvoices />} /> 
        <Route path="/patients" element={<SearchPatient />} /> 
        <Route path="/d" element={<ViewPatient />} /> 

        {/* Redirect root */}
        <Route path="/a" element={<Navigate to="/staff" />} />

        {/* Staff management */}
        <Route path="/staff" element={<StaffListPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/staff/add" element={<StaffAddPage />} />
        <Route path="/staff/:id" element={<StaffProfilePage />} />
        <Route path="/staff/:id/password" element={<ChangePasswordPage />} />

        {/* Default redirect */}
        <Route
          path="/r"
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

        {/* Fallback */}
        <Route
          path="*"
          element={<Navigate to="/patients/medical-records" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
