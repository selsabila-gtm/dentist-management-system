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
        <Route path="/patients" element={<SearchPatient />} />
        
        {/* Patient profile - General Info comes FIRST, must be exact match */}
        <Route path="/patients/:id" element={<ViewPatient />} />
        
        {/* Patient profile tabs - these come AFTER the general route */}
        <Route path="/patients/:id/appointments" element={<Appointment />} />
        <Route path="/patients/:id/treatment-plans" element={<TreatmentPlansPage />} />
        <Route path="/patients/:id/medical-records" element={<MedicalRecordsPage />} />
        <Route path="/patients/:id/prescriptions" element={<PrescriptionsPage />} />
        <Route path="/patients/:id/invoices" element={<PatientInvoices />} />

        {/* Staff management */}
        <Route path="/staff" element={<StaffListPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/staff/add" element={<StaffAddPage />} />
        <Route path="/staff/:id" element={<StaffProfilePage />} />
        <Route path="/staff/:id/password" element={<ChangePasswordPage />} />

        {/* Default redirects */}
        <Route path="/" element={<Navigate to="/patients" replace />} />
        <Route path="*" element={<Navigate to="/patients" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;