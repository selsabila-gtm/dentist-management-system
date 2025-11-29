// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import StaffListPage from "./pages/staff/list.jsx";
import StaffAddPage from "./pages/staff/add.jsx";
import LoginPage from "./pages/staff/login";
import ResetPasswordPage from "./pages/staff/resetPassword";
import ChangePasswordPage from "./pages/staff/changePassword.jsx";
import StaffProfilePage from "./pages/staff/profile.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
