import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Sidebar from "./components/sidebar/sidebar.jsx";

// Appointment pages
import Calendar from "./pages/appointments/calendar.jsx";
import Add from "./pages/appointments/add.jsx";
import PostSummary from "./pages/appointments/post_summary.jsx";

// Patient pages
import AddPatient from "./pages/patients/AddPatient.jsx";
import Appointment from "./pages/patients/PatientAppointment.jsx";
import PatientInvoices from "./pages/patients/PatientInvoices.jsx";
import SearchPatient from "./pages/patients/SearchPatient.jsx";
import ViewPatient from "./pages/patients/ViewPatient.jsx";
import MedicalRecordsPage from "./pages/patients/MedicalRecords.jsx";
import PrescriptionsPage from "./pages/patients/Prescriptions.jsx";
import TreatmentPlansPage from "./pages/patients/TreatmentPlans.jsx";

// Staff pages
import StaffListPage from "./pages/staff/list.jsx";
import StaffAddPage from "./pages/staff/add.jsx";
import LoginPage from "./pages/staff/login.jsx";
import ResetPasswordPage from "./pages/staff/resetPassword.jsx";
import ChangePasswordPage from "./pages/staff/changePassword.jsx";
import StaffProfilePage from "./pages/staff/profile.jsx";

import "./index.css";
import "./components/sidebar/sidebar.css";
import "./App.css";

// Inner app that can use useLocation (must be inside Router)
function AppInner() {
  const location = useLocation();

  // Routes where we DON'T want the sidebar
  const hideSidebarRoutes = ["/login", "/reset-password"];
  const hideSidebar = hideSidebarRoutes.includes(location.pathname);

  return (
    <div className="app-layout">
      {/* Show sidebar on all pages except login / reset-password */}
      {!hideSidebar && <Sidebar />}

      <main className="app-main">
        <Routes>
          {/* ---------- CALENDAR / APPOINTMENTS ---------- */}
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/calendar/add" element={<Add />} />
          <Route path="/calendar/post-summary/:id" element={<PostSummary />} />

          {/* ---------- PATIENTS ---------- */}
          <Route path="/patients" element={<SearchPatient />} />
          <Route path="/patients/add" element={<AddPatient />} />
          <Route path="/patients/appointments" element={<Appointment />} />
          <Route path="/patients/invoices" element={<PatientInvoices />} />
          <Route path="/patients/view" element={<ViewPatient />} />

          {/* Patient profile tabs */}
          <Route path="/patients/medical-records" element={<MedicalRecordsPage />} />
          <Route path="/patients/prescriptions" element={<PrescriptionsPage />} />
          <Route path="/patients/treatment-plans" element={<TreatmentPlansPage />} />

          {/* ---------- STAFF ---------- */}
          <Route path="/staff" element={<StaffListPage />} />
          <Route path="/staff/add" element={<StaffAddPage />} />
          <Route path="/staff/:id" element={<StaffProfilePage />} />
          <Route path="/staff/:id/password" element={<ChangePasswordPage />} />

          {/* Authentication */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* ---------- DEFAULT REDIRECT ---------- */}
          <Route path="/" element={<Navigate to="/calendar" replace />} />
          <Route path="*" element={<Navigate to="/calendar" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppInner />
    </Router>
  );
}
