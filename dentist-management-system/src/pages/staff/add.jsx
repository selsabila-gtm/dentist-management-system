// src/pages/staff/add.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StaffAdminLayout from "../../components/StaffAdminLayout";
import { createStaff, fetchRoles } from "../../services/staffApi";
import Sidebar from "../../components/Sidebar/Sidebar";
import "../../styles/staff.css";

const defaultPermissions = {
  can_access_records: false,
  can_manage_appointments: false,
  can_manage_billing: false,
  can_generate_reports: false,
  is_admin: false,
};

const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem("currentUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// Helper to validate hours are between 8:00 AM and 6:00 PM
const validateHoursRange = (hoursString) => {
  if (!hoursString || hoursString.trim() === "") return { valid: true };
  
  // Match format like "9:00 AM – 5:00 PM" or "9:00 AM - 5:00 PM"
  const match = hoursString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*[-–—]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  
  if (!match) return { valid: false, error: "Invalid hours format. Use format like '9:00 AM - 5:00 PM'" };
  
  const startHour = parseInt(match[1]);
  const startMin = parseInt(match[2]);
  const startPeriod = match[3].toUpperCase();
  const endHour = parseInt(match[4]);
  const endMin = parseInt(match[5]);
  const endPeriod = match[6].toUpperCase();
  
  // Convert to 24-hour format
  let start24 = startHour;
  if (startPeriod === 'PM' && startHour !== 12) start24 += 12;
  if (startPeriod === 'AM' && startHour === 12) start24 = 0;
  
  let end24 = endHour;
  if (endPeriod === 'PM' && endHour !== 12) end24 += 12;
  if (endPeriod === 'AM' && endHour === 12) end24 = 0;
  
  // Check if between 8:00 AM (8) and 6:00 PM (18)
  if (start24 < 8 || start24 > 18) {
    return { valid: false, error: "Start time must be between 8:00 AM and 6:00 PM" };
  }
  
  if (end24 < 8 || end24 > 18) {
    return { valid: false, error: "End time must be between 8:00 AM and 6:00 PM" };
  }
  
  if (start24 >= end24) {
    return { valid: false, error: "Start time must be before end time" };
  }
  
  return { valid: true };
};

export default function StaffAddPage() {
  const navigate = useNavigate();

  const [roles, setRoles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // toast state
  const [toast, setToast] = useState({
    visible: false,
    type: "success",
    message: "",
  });

  const showToast = (message, type = "success") => {
    setToast({ visible: true, type, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    username: "",
    password: "",
    role_id: "",
    permissions: defaultPermissions,
    days_available: "",
    hours: "",
  });

  // NEW: custom values when "Custom" is selected
  const [customDays, setCustomDays] = useState("");
  const [customHours, setCustomHours] = useState("");

  // auth check + load roles
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const data = await fetchRoles();
        setRoles(data);
      } catch (err) {
        console.error(err);
        showToast("Failed to load roles", "error");
      }
    };

    const checkAndLoad = async () => {
      const user = getCurrentUser();
      if (!user || !user.is_admin) {
        setIsAdmin(false);
        setAuthChecked(true);
        showToast("You don't have permission to manage staff.", "error");
        return;
      }
      setIsAdmin(true);
      setAuthChecked(true);
      await loadRoles();
    };

    checkAndLoad();
  }, []);

  // generic field change
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // ✅ Clear error when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // if user switches away from "Custom", clear the extra inputs
    if (name === "days_available" && value !== "Custom") {
      setCustomDays("");
    }
    if (name === "hours" && value !== "Custom") {
      setCustomHours("");
    }
  };

  // permissions checkboxes
  const handlePermissionChange = (e) => {
    const { name, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      permissions: { ...prev.permissions, [name]: checked },
    }));
  };

  // validate inputs and set errors
  const validateForm = () => {
    const newErrors = {};

    if (!form.first_name.trim()) {
      newErrors.first_name = "First name is required.";
    }
    if (!form.last_name.trim()) {
      newErrors.last_name = "Last name is required.";
    }

    // Email validation - only show error if email is entered but invalid
    if (form.email.trim()) {
      if (!/^\S+@\S+\.\S+$/.test(form.email)) {
        newErrors.email = "Please enter a valid email address.";
      }
    } else {
      newErrors.email = "Email is required.";
    }

    // Phone validation - only if something is entered
    if (form.phone.trim() && !/^[0-9+\s()-]{6,}$/.test(form.phone)) {
      newErrors.phone = "Please enter a valid phone number.";
    }

    if (!form.username.trim()) {
      newErrors.username = "Username is required.";
    } else if (form.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters.";
    }

    // Password validation - only show length error if something is entered
    if (!form.password.trim()) {
      newErrors.password = "Password is required.";
    } else if (form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    }

    if (!form.role_id) {
      newErrors.role_id = "Please select a role.";
    }

    // Validate custom hours if selected
    if (form.hours === "Custom" && customHours.trim()) {
      const hoursValidation = validateHoursRange(customHours);
      if (!hoursValidation.valid) {
        newErrors.hours = hoursValidation.error;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      // ✅ Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errorElement.focus();
      }
      showToast("Please fix the errors in the form", "error");
      return;
    }

    try {
      setSaving(true);

      // if "Custom" is selected, use the custom text instead of the word "Custom"
      const payload = {
        ...form,
        role_id: parseInt(form.role_id, 10),
        days_available:
          form.days_available === "Custom" ? customDays : form.days_available,
        hours: form.hours === "Custom" ? customHours : form.hours,
      };

      await createStaff(payload);
      showToast("Employee created", "success");
      setTimeout(() => {
        window.location.href = "/staff";
      }, 400);
    } catch (err) {
      console.error(err);
      showToast("Failed to save employee", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="app-layout">
        <Sidebar/>
      <StaffAdminLayout>
        <div className="staff-main">
          <p>Loading...</p>
        </div>
      </StaffAdminLayout>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="app-layout">
      <Sidebar />
      <StaffAdminLayout>
        {toast.visible && (
          <div className="toast-container">
            <div
              className={`toast ${
                toast.type === "error" ? "toast-error" : "toast-success"
              }`}
            >
              <span className="toast-message">{toast.message}</span>
              <button
                type="button"
                className="toast-close"
                onClick={() =>
                  setToast((prev) => ({ ...prev, visible: false }))
                }
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="staff-main">
          <div className="staff-card">
            <h1 className="staff-page-title" style={{ fontSize: 22 }}>
              Access denied
            </h1>
            <p style={{ marginTop: 8, color: "#6b7280", fontSize: 14 }}>
              You do not have permission to create staff accounts.
            </p>
            <button
              type="button"
              className="btn-secondary"
              style={{ marginTop: 16 }}
              onClick={() => navigate("/")}
            >
              Go back
            </button>
          </div>
        </div>
      </StaffAdminLayout>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
    <StaffAdminLayout>
      {toast.visible && (
        <div className="toast-container">
          <div
            className={`toast ${
              toast.type === "error" ? "toast-error" : "toast-success"
            }`}
          >
            <span className="toast-message">{toast.message}</span>
            <button
              type="button"
              className="toast-close"
              onClick={() =>
                setToast((prev) => ({ ...prev, visible: false }))
              }
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="staff-page-header">
        <h1 className="staff-page-title">Add New Employee</h1>
      </div>

      <form
        className="staff-card staff-form"
        onSubmit={handleSubmit}
      >
        {/* LEFT COLUMN: Personal Information */}
        <div className="staff-form-section">
          <h2>Personal Information</h2>

          <div className="staff-field">
            <label>First Name</label>
            <input
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              className={
                errors.first_name
                  ? "staff-input staff-input-error"
                  : "staff-input"
              }
            />
            {errors.first_name && (
              <p className="staff-error-text">{errors.first_name}</p>
            )}
          </div>

          <div className="staff-field">
            <label>Last Name</label>
            <input
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              className={
                errors.last_name
                  ? "staff-input staff-input-error"
                  : "staff-input"
              }
            />
            {errors.last_name && (
              <p className="staff-error-text">{errors.last_name}</p>
            )}
          </div>

          <div className="staff-field">
            <label>Email</label>
            <input
              type="text"
              name="email"
              value={form.email}
              onChange={handleChange}
              className={
                errors.email ? "staff-input staff-input-error" : "staff-input"
              }
            />
            {errors.email && (
              <p className="staff-error-text">{errors.email}</p>
            )}
          </div>

          <div className="staff-field">
            <label>Phone Number</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className={
                errors.phone ? "staff-input staff-input-error" : "staff-input"
              }
            />
            {errors.phone && (
              <p className="staff-error-text">{errors.phone}</p>
            )}
          </div>

          <div className="staff-field">
            <label>Address</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              className="staff-input"
            />
          </div>

          <div className="staff-field">
            <label>Role</label>
            <select
              name="role_id"
              value={form.role_id}
              onChange={handleChange}
              className={
                errors.role_id ? "staff-input staff-input-error" : "staff-input"
              }
            >
              <option value="">Select role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            {errors.role_id && (
              <p className="staff-error-text">{errors.role_id}</p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Login Credentials, Work Schedule */}
        <div className="staff-form-section">
          <h2>Login Credentials</h2>
          <div className="staff-field">
            <label>Username</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              className={
                errors.username
                  ? "staff-input staff-input-error"
                  : "staff-input"
              }
            />
            {errors.username && (
              <p className="staff-error-text">{errors.username}</p>
            )}
          </div>
          <div className="staff-field">
            <label>Temporary Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className={
                errors.password
                  ? "staff-input staff-input-error"
                  : "staff-input"
              }
            />
            {errors.password && (
              <p className="staff-error-text">{errors.password}</p>
            )}
          </div>

          <h2>Work Schedule</h2>

          <div className="staff-field">
            <label>Days Available</label>
            <select
              name="days_available"
              value={form.days_available}
              onChange={handleChange}
              className="staff-input"
            >
              <option value="">Select days</option>
              <option value="Sunday, Monday, Tuesday, Wednesday, Thursday">
                Sunday, Monday, Tuesday, Wednesday, Thursday
              </option>
              <option value="Saturday, Sunday">Saturday, Sunday</option>
              <option value="Custom">Custom</option>
            </select>

            {form.days_available === "Custom" && (
              <input
                type="text"
                className="staff-input"
                placeholder="Enter custom days (e.g. Monday, Wednesday) - No Fridays"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                style={{ marginTop: 6 }}
              />
            )}
          </div>

          <div className="staff-field">
            <label>Hours (8:00 AM - 6:00 PM only)</label>
            <select
              name="hours"
              value={form.hours}
              onChange={handleChange}
              className={
                errors.hours ? "staff-input staff-input-error" : "staff-input"
              }
            >
              <option value="">Select hours</option>
              <option value="9:00 AM – 5:00 PM">9:00 AM – 5:00 PM</option>
              <option value="10:00 AM – 6:00 PM">10:00 AM – 6:00 PM</option>
              <option value="8:00 AM – 4:00 PM">8:00 AM – 4:00 PM</option>
              <option value="Custom">Custom</option>
            </select>

            {form.hours === "Custom" && (
              <>
                <input
                  type="text"
                  className={
                    errors.hours
                      ? "staff-input staff-input-error"
                      : "staff-input"
                  }
                  placeholder="Enter hours (e.g. 9:00 AM – 5:00 PM)"
                  value={customHours}
                  onChange={(e) => {
                    setCustomHours(e.target.value);
                    // ✅ Clear error when user types in custom hours
                    if (errors.hours) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.hours;
                        return newErrors;
                      });
                    }
                  }}
                  style={{ marginTop: 6 }}
                />
                <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                  Hours must be between 8:00 AM and 6:00 PM
                </p>
              </>
            )}
            {errors.hours && (
              <p className="staff-error-text">{errors.hours}</p>
            )}
          </div>

          <div className="staff-form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => (window.location.href = "/staff")}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </form>
    </StaffAdminLayout>
    </div>
  );
}