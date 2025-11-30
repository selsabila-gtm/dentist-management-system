// src/pages/staff/add.jsx
import { useEffect, useState } from "react";
import StaffLayout from "../../components/StaffLayout";
import { createStaff, fetchRoles } from "../../services/staffApi";
import "../../styles/staff.css";

const defaultPermissions = {
  can_access_records: false,
  can_manage_appointments: false,
  can_manage_billing: false,
  can_generate_reports: false,
  is_admin: false,
};

export default function StaffAddPage() {
  const [roles, setRoles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

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
    availability: "",
    days_available: "",
    hours: "",
  });

  // NEW: custom values when "Custom" is selected
  const [customDays, setCustomDays] = useState("");
  const [customHours, setCustomHours] = useState("");

  // load roles on mount
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const data = await fetchRoles();
        setRoles(data);
      } catch (err) {
        console.error(err);
        alert("Failed to load roles");
      }
    };
    loadRoles();
  }, []);

  // generic field change
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

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

    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (form.phone && !/^[0-9+\s()-]{6,}$/.test(form.phone)) {
      newErrors.phone = "Please enter a valid phone number.";
    }

    if (!form.username || form.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters.";
    }

    if (!form.password || form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    }

    if (!form.role_id) {
      newErrors.role_id = "Please select a role.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      // errors will be shown under the fields
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
      alert("Employee created");
      window.location.href = "/staff";
    } catch (err) {
      console.error(err);
      alert("Failed to save employee");
    } finally {
      setSaving(false);
    }
  };

  return (
    <StaffLayout>
      <div className="staff-page-header">
        <h1 className="staff-page-title">Add New Employee</h1>
      </div>

      <form
        className="staff-card staff-form staff-form-two-col"
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
              required
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
              required
            />
            {errors.last_name && (
              <p className="staff-error-text">{errors.last_name}</p>
            )}
          </div>

          <div className="staff-field">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className={
                errors.email ? "staff-input staff-input-error" : "staff-input"
              }
              required
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
              required
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

        {/* RIGHT COLUMN: Permissions, Login Credentials, Work Schedule */}
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
              required
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
              required
            />
            {errors.password && (
              <p className="staff-error-text">{errors.password}</p>
            )}
          </div>

          <h2>Work Schedule</h2>
          <div className="staff-field">
            <label>Availability</label>
            <select
              name="availability"
              value={form.availability}
              onChange={handleChange}
              className="staff-input"
            >
              <option value="">Select availability</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="On-call">On-call</option>
            </select>
          </div>

          <div className="staff-field">
            <label>Days Available</label>
            <select
              name="days_available"
              value={form.days_available}
              onChange={handleChange}
              className="staff-input"
            >
              <option value="">Select days</option>
              <option value="Monday – Friday">
                Monday, Tuesday, Wednesday, Thursday, Friday
              </option>
              <option value="Weekends">Saturday, Sunday</option>
              <option value="Custom">Custom</option>
            </select>

            {form.days_available === "Custom" && (
              <input
                type="text"
                className="staff-input"
                placeholder="Enter custom days (e.g. Mon, Wed, Fri)"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                required
              />
            )}
          </div>

          <div className="staff-field">
            <label>Hours</label>
            <select
              name="hours"
              value={form.hours}
              onChange={handleChange}
              className="staff-input"
            >
              <option value="">Select hours</option>
              <option value="9:00 AM – 5:00 PM">9:00 AM – 5:00 PM</option>
              <option value="10:00 AM – 6:00 PM">10:00 AM – 6:00 PM</option>
              <option value="Custom">Custom</option>
            </select>

            {form.hours === "Custom" && (
              <input
                type="text"
                className="staff-input"
                placeholder="Enter custom hours (e.g. 2:00 PM – 8:00 PM)"
                value={customHours}
                onChange={(e) => setCustomHours(e.target.value)}
                required
              />
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
    </StaffLayout>
  );
}
