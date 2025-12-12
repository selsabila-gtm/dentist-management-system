// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

// ----- LAYOUT -----
import Sidebar from "./components/sidebar/sidebar.jsx";
import StaffLayout from "./components/staffLayout.jsx";

// ----- STAFF PAGES -----
import StaffListPage from "./pages/staff/list.jsx";
import StaffAddPage from "./pages/staff/add.jsx";
import LoginPage from "./pages/staff/login";
import ResetPasswordPage from "./pages/staff/resetPassword";
import ChangePasswordPage from "./pages/staff/changePassword.jsx";
import StaffProfilePage from "./pages/staff/profile.jsx";

// ----- PATIENT PAGES -----
import MedicalRecordsPage from "./pages/patients/MedicalRecords.jsx";
import PrescriptionsPage from "./pages/patients/Prescriptions.jsx";
import TreatmentPlansPage from "./pages/patients/TreatmentPlans.jsx";

import ReportsPage from "./pages/reports/reports.jsx";

// src/App.jsx
// ...
import BillingPage from "./pages/billing/billing.jsx";
import AddInvoicePage from "./pages/billing/AddInvoice.jsx";
import InvoicePrintPage from "./pages/billing/InvoicePrint.jsx"; // 👈 NEW
// ...




// ----- SIMPLE PLACEHOLDER PAGES FOR OTHER SECTIONS -----
// (Replace these later with your team’s real pages if they exist)
const DashboardPage = () => <h1 style={{ padding: "2rem" }}>Dashboard</h1>;
const CalendarPage = () => <h1 style={{ padding: "2rem" }}>Calendar</h1>;
//const BillingPage = () => <h1 style={{ padding: "2rem" }}>Billing</h1>;
const InventoryPage = () => <h1 style={{ padding: "2rem" }}>Inventory</h1>;
const SettingsPage = () => <h1 style={{ padding: "2rem" }}>Settings</h1>;

// ----- WRAPPER LAYOUT WITH SIDEBAR -----
function LayoutWithSidebar({ children }) {
  return (
    <div className="app-shell" style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ flex: 1 }}>
        {/* This keeps your staff styles / container */}
        <StaffLayout>{children}</StaffLayout>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home redirects to staff list */}
        <Route path="/" element={<Navigate to="/staff" replace />} />

        {/* AUTH PAGES (NO SIDEBAR) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/staff/:id/password"
          element={<ChangePasswordPage />}
        />

        {/* DASHBOARD / CALENDAR WITH SIDEBAR */}
        <Route
          path="/dashboard"
          element={
            <LayoutWithSidebar>
              <DashboardPage />
            </LayoutWithSidebar>
          }
        />
        <Route
          path="/calendar"
          element={
            <LayoutWithSidebar>
              <CalendarPage />
            </LayoutWithSidebar>
          }
        />

        {/* STAFF PAGES WITH SIDEBAR */}
        <Route
          path="/staff"
          element={
            <LayoutWithSidebar>
              <StaffListPage />
            </LayoutWithSidebar>
          }
        />
        <Route
          path="/staff/add"
          element={
            <LayoutWithSidebar>
              <StaffAddPage />
            </LayoutWithSidebar>
          }
        />
        <Route
          path="/staff/:id"
          element={
            <LayoutWithSidebar>
              <StaffProfilePage />
            </LayoutWithSidebar>
          }
        />

        {/* PATIENT PAGES WITH SIDEBAR */}
        {/* Main Patients link from sidebar -> show Medical Records by default */}
        <Route
          path="/patients"
          element={
            <LayoutWithSidebar>
              <MedicalRecordsPage />
            </LayoutWithSidebar>
          }
        />
        <Route
          path="/patients/medical-records"
          element={
            <LayoutWithSidebar>
              <MedicalRecordsPage />
            </LayoutWithSidebar>
          }
        />
        <Route
          path="/patients/prescriptions"
          element={
            <LayoutWithSidebar>
              <PrescriptionsPage />
            </LayoutWithSidebar>
          }
        />
        <Route
          path="/patients/treatment-plans"
          element={
            <LayoutWithSidebar>
              <TreatmentPlansPage />
            </LayoutWithSidebar>
          }
        />

        {/* BILLING / INVENTORY / REPORTS / SETTINGS WITH SIDEBAR */}
        <Route
          path="/billing"
          element={
            <LayoutWithSidebar>
              <BillingPage />
            </LayoutWithSidebar>
          }
        />
        <Route
          path="/billing/new"
          element={
            <LayoutWithSidebar>
              <AddInvoicePage  />
            </LayoutWithSidebar>
          }
        />
        <Route
          path="/billing/invoice/:id"
          element={
            <LayoutWithSidebar>
              <InvoicePrintPage />
            </LayoutWithSidebar>
          }
        />
        <Route
          path="/inventory"
          element={
            <LayoutWithSidebar>
              <InventoryPage />
            </LayoutWithSidebar>
          }
        />
        <Route
          path="/reports"
          element={
            <LayoutWithSidebar>
              <ReportsPage />
            </LayoutWithSidebar>
          }
        />
        <Route
          path="/settings"
          element={
            <LayoutWithSidebar>
              <SettingsPage />
            </LayoutWithSidebar>
          }
        />

        {/* FALLBACK: unknown routes -> staff */}
        <Route path="*" element={<Navigate to="/staff" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
