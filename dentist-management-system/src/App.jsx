// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

// Auth pages
import LoginPage from "./pages/auth/login";
import DashboardPage from "./pages/dashboard/dashboard";

// Inventory pages
import InventoryListPage from "./pages/inventory/list";
import InventoryAddPage from "./pages/inventory/add";
import InventoryDetailsPage from "./pages/inventory/details";

// Calendar pages
import Calendar from "./pages/appointments/calendar";

import Staff from "./pages/staff/list";

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
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          }
        />
        
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

        {/* Calendar routes */}
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <Calendar />
            </ProtectedRoute>
          }
        />

        {/* Placeholder routes for other sections */}
        <Route path="/staff" element={<ProtectedRoute><Staff /></ProtectedRoute>} />
        <Route path="/patients" element={<ProtectedRoute><div>Patients Page (Coming Soon)</div></ProtectedRoute>} />
        <Route path="/billing" element={<ProtectedRoute><div>Billing Page (Coming Soon)</div></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><div>Reports Page (Coming Soon)</div></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><div>Settings Page (Coming Soon)</div></ProtectedRoute>} />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;