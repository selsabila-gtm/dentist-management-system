// src/App.jsx

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

// Auth pages
import LoginPage from "./pages/auth/login";

// Dashboard
import DashboardPage from "./pages/dashboard/dashboard.jsx";

// Inventory pages
import InventoryListPage from "./pages/inventory/list";
import InventoryAddPage from "./pages/inventory/add";
import InventoryDetailsPage from "./pages/inventory/details";

// Calendar / Appointments pages
import Calendar from "./pages/appointments/calendar";
import AppointmentAddPage from "./pages/appointments/add";
import AppointmentPostSummaryPage from "./pages/appointments/post_summary";

// Settings
import SettingsPage from "./pages/settings/settings.jsx";

// Staff pages
import Staff from "./pages/staff/list";
import StaffAddPage from "./pages/staff/add.jsx";
import StaffProfilePage from "./pages/staff/profile.jsx";
import ChangePasswordPage from "./pages/staff/changePassword.jsx";

// Patient pages
import AddPatient from "./pages/patients/AddPatient.jsx";
import Appointment from "./pages/patients/PatientAppointment.jsx";
import PatientInvoices from "./pages/patients/PatientInvoices.jsx";
import SearchPatient from "./pages/patients/SearchPatient.jsx";
import ViewPatient from "./pages/patients/ViewPatient.jsx";

import MedicalRecordsPage from "./pages/patients/MedicalRecords.jsx";
import PrescriptionsPage from "./pages/patients/Prescriptions.jsx";
import TreatmentPlansPage from "./pages/patients/TreatmentPlans.jsx";

// Billing
import BillingPage from "./pages/billing/billing.jsx";
import AddInvoicePage from "./pages/billing/AddInvoice.jsx";
import InvoicePrintPage from "./pages/billing/InvoicePrint.jsx";


// Protected Route Component
function ProtectedRoute({ children }) {
  const staffId = localStorage.getItem("staff_id");

  if (!staffId) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ---------------- PUBLIC ---------------- */}
        <Route path="/login" element={<LoginPage />} />

        {/* ---------------- PATIENT (UNPROTECTED in your current setup) ---------------- */}
        <Route path="/add-patient" element={<AddPatient />} />
        <Route path="/b" element={<Appointment />} />
        <Route path="/c" element={<PatientInvoices />} />
        <Route path="/patients" element={<SearchPatient />} />
        <Route path="/patient/:id" element={<ViewPatient />} />

        {/* Redirect root */}
        <Route path="/a" element={<Navigate to="/staff" />} />

        {/* ---------------- PROTECTED ---------------- */}
        {/* Default redirect */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Inventory routes */}
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <InventoryListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/add"
          element={
            <ProtectedRoute>
              <InventoryAddPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/:id"
          element={
            <ProtectedRoute>
              <InventoryDetailsPage />
            </ProtectedRoute>
          }
        />

        {/* Calendar / Appointments routes */}
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <Calendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar/add"
          element={
            <ProtectedRoute>
              <AppointmentAddPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar/post-summary/:id"
          element={
            <ProtectedRoute>
              <AppointmentPostSummaryPage />
            </ProtectedRoute>
          }
        />

        {/* Staff management */}
        <Route
          path="/staff"
          element={
            <ProtectedRoute>
              <Staff />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/add"
          element={
            <ProtectedRoute>
              <StaffAddPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/:id"
          element={
            <ProtectedRoute>
              <StaffProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/:id/password"
          element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          }
        />

        {/* ✅ Patient pages (protected) now PER PATIENT */}
        <Route
          path="/patients/:patientId/medical-records"
          element={
            <ProtectedRoute>
              <MedicalRecordsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients/:patientId/prescriptions"
          element={
            <ProtectedRoute>
              <PrescriptionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients/:patientId/treatment-plans"
          element={
            <ProtectedRoute>
              <TreatmentPlansPage />
            </ProtectedRoute>
          }
        />

        {/* Billing */}
        <Route
          path="/billing"
          element={
            <ProtectedRoute>
              <BillingPage />
            </ProtectedRoute>
          }
        />

        {/* Reports placeholder */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <div>Reports Page (Coming Soon)</div>
            </ProtectedRoute>
          }
        />

        <Route
          path="/billing"
          element={
            <ProtectedRoute>
              <div><BillingPage /></div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback route -> dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;