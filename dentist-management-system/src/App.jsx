// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

// Auth utils
import { getCurrentUser } from "./utils/auth";

// Auth pages
import LoginPage from "./pages/auth/login.jsx"; // ⬅️ matches your file path
import ResetPasswordPage from "./pages/staff/resetPassword";

// Inventory pages
import InventoryListPage from "./pages/inventory/list";
import InventoryAddPage from "./pages/inventory/add";
import InventoryDetailsPage from "./pages/inventory/details";
import Dashboard from "./pages/dashboard/dashboard.jsx";

// Calendar / Appointments pages
import Calendar from "./pages/appointments/calendar";
import AppointmentAddPage from "./pages/appointments/add";
import AppointmentPostSummaryPage from "./pages/appointments/post_summary";

// Staff pages
import Staff from "./pages/staff/list";
import StaffAddPage from "./pages/staff/add.jsx";
import StaffProfilePage from "./pages/staff/profile.jsx";
import ChangePasswordPage from "./pages/staff/changePassword.jsx";

// Patient pages
import MedicalRecordsPage from "./pages/patients/MedicalRecords.jsx";
import PrescriptionsPage from "./pages/patients/Prescriptions.jsx";
import TreatmentPlansPage from "./pages/patients/TreatmentPlans.jsx";
import AddPatientPage from "./pages/patients/AddPatient.jsx";

// Reports page (real one, not placeholder)
import ReportsPage from "./pages/reports/reports.jsx";

import BillingPage from "./pages/billing/billing.jsx";

// ✅ Protected Route Component – only checks if user is logged in
function ProtectedRoute({ children }) {
  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Root redirects to dashboard (staff list for now) */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Dashboard -> same as staff list for now */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
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

        {/* Staff management (admin-only logic is inside the pages/layout) */}
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

        {/* Patient pages (protected) */}
        <Route
          path="/patients/medical-records"
          element={
            <ProtectedRoute>
              <MedicalRecordsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients/prescriptions"
          element={
            <ProtectedRoute>
              <PrescriptionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients/treatment-plans"
          element={
            <ProtectedRoute>
              <TreatmentPlansPage />
            </ProtectedRoute>
          }
        />

        {/* Placeholder / other sections (protected) */}
        <Route
          path="/patients"
          element={
            <ProtectedRoute>
              <div>Patients Page (Coming Soon)</div>
            </ProtectedRoute>
          }
        />

        {/* ✅ Real reports page, admin-only logic is inside ReportsPage */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ReportsPage />
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
              <div>Settings Page (Coming Soon)</div>
            </ProtectedRoute>
          }
        />
             <Route
  path="/patients/add"
  element={
    <ProtectedRoute>
      <AddPatientPage />
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
