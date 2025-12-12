// src/pages/staff/profile.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StaffAdminLayout from "../../components/StaffAdminLayout";
import "../../styles/staff.css";
import {
  fetchRoles,
  fetchStaffById,
  updateStaff,
} from "../../services/staffApi";

const availabilityOptions = ["Full-time", "Part-time", "On-call"];
// preset values must match what add.jsx saves
const daysPresetOptions = ["Monday – Friday", "Weekends"];
const hoursPresetOptions = ["9:00 AM – 5:00 PM", "10:00 AM – 6:00 PM"];

const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem("currentUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export default function StaffProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [staff, setStaff] = useState(null);
  const [roles, setRoles] = useState([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});

  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // extra state for "Custom" schedule values
  const [customDays, setCustomDays] = useState("");
  const [customHours, setCustomHours] = useState("");

  // toast
  const [toast, setToast] = useState({
    visible: false,
    type: "success",
    message: "",
  });

  const [showDeactivate, setShowDeactivate] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ visible: true, type, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  // ------- auth check -------
  useEffect(() => {
    const user = getCurrentUser();
    if (!user || !user.is_admin) {
      setIsAdmin(false);
      showToast("You don't have permission to view this staff profile.", "error");
    } else {
      setIsAdmin(true);
    }
    setAuthChecked(true);
  }, []);

  // ------- load staff + roles -------  
  useEffect(() => {
    if (!isAdmin) return;

    const load = async () => {
      try {
        const [staffData, rolesData] = await Promise.all([
          fetchStaffById(id),
          fetchRoles(),
        ]);

        // detect custom vs preset days/hours
        const rawDays = staffData.days_available || "";
        const rawHours = staffData.hours || "";

        let daysValue = rawDays;
        let hoursValue = rawHours;
        let daysCustom = "";
        let hoursCustom = "";

        if (rawDays && !daysPresetOptions.includes(rawDays)) {
          daysValue = "Custom";
          daysCustom = rawDays;
        }

        if (rawHours && !hoursPresetOptions.includes(rawHours)) {
          hoursValue = "Custom";
          hoursCustom = rawHours;
        }

        setStaff(staffData);
        setRoles(rolesData);

        setForm({
          first_name: staffData.first_name || "",
          last_name: staffData.last_name || "",
          username: staffData.username || "",
          email: staffData.email || "",
          phone: staffData.phone || "",
          address: staffData.address || "",
          role_id: staffData.role_id || "",
          availability: staffData.availability || "",
          days_available: daysValue,
          hours: hoursValue,
        });

        setCustomDays(daysCustom);
        setCustomHours(hoursCustom);
      } catch (err) {
        console.error(err);
        showToast("Failed to load staff member", "error");
        navigate("/staff");
      }
    };

    load();
  }, [id, navigate, isAdmin]);

  // auth loading
  if (!authChecked) {
    return (
      <StaffAdminLayout>
        <div className="staff-main">
          <p>Loading...</p>
        </div>
      </StaffAdminLayout>
    );
  }

  // access denied
  if (!isAdmin) {
    return (
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

        <main className="staff-main">
          <div className="staff-card">
            <h1 className="staff-page-title" style={{ fontSize: 22 }}>
              Access denied
            </h1>
            <p style={{ marginTop: 8, color: "#6b7280", fontSize: 14 }}>
              You do not have permission to view or edit staff profiles.
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
        </main>
      </StaffAdminLayout>
    );
  }

  if (!staff || !form) {
    return (
      <StaffAdminLayout>
        <div className="staff-main">
          <p>Loading...</p>
        </div>
      </StaffAdminLayout>
    );
  }

  // ---------- derived display values ----------

  const fullName = `${staff.first_name || ""} ${staff.last_name || ""}`.trim();

  // avatar initial: prefer name, then username, then "E"
  const avatarInitial = fullName
    ? fullName.charAt(0).toUpperCase()
    : staff.username
    ? staff.username.charAt(0).toUpperCase()
    : "E";

  // role display: use nested role OR find by role_id OR fallback
  const roleName =
    staff.role?.name ||
    roles.find((r) => r.id === staff.role_id)?.name ||
    "No role";

  // joined text based on created_at (days/weeks/months/years)
  let joinedText = "";
  if (staff.created_at) {
    const created = new Date(staff.created_at);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      joinedText = "Joined today";
    } else if (diffDays === 1) {
      joinedText = "Joined 1 day ago";
    } else if (diffDays < 7) {
      joinedText = `Joined ${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      joinedText = weeks === 1 ? "Joined 1 week ago" : `Joined ${weeks} weeks ago`;
    } else {
      const monthsDiff =
        (now.getFullYear() - created.getFullYear()) * 12 +
        (now.getMonth() - created.getMonth());
      if (monthsDiff < 12) {
        joinedText =
          monthsDiff === 1
            ? "Joined 1 month ago"
            : `Joined ${monthsDiff} months ago`;
      } else {
        const years = Math.floor(monthsDiff / 12);
        joinedText = `Joined ${years} year${years > 1 ? "s" : ""} ago`;
      }
    }
  }

  // ------- form handlers -------

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "days_available" && value !== "Custom") {
      setCustomDays("");
    }
    if (name === "hours" && value !== "Custom") {
      setCustomHours("");
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!form.first_name.trim()) newErrors.first_name = "First name is required";
    if (!form.last_name.trim()) newErrors.last_name = "Last name is required";
    if (!form.username.trim()) newErrors.username = "Username is required";

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (form.phone && !/^[0-9+\-\s]{6,20}$/.test(form.phone)) {
      newErrors.phone = "Phone number looks invalid";
    }

    if (!form.role_id) newErrors.role_id = "Role is required";

    if (form.days_available === "Custom" && !customDays.trim()) {
      newErrors.days_available = "Please enter custom days or choose a preset.";
    }
    if (form.hours === "Custom" && !customHours.trim()) {
      newErrors.hours = "Please enter custom hours or choose a preset.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      ...form,
      role_id: parseInt(form.role_id, 10),
      days_available:
        form.days_available === "Custom" ? customDays : form.days_available,
      hours: form.hours === "Custom" ? customHours : form.hours,
    };

    try {
      setSaving(true);
      await updateStaff(staff.id, payload);
      showToast("Employee updated");
      setEditing(false);
    } catch (err) {
      console.error(err);
      showToast("Failed to update employee", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => navigate("/staff");

  const handleChangePassword = () => {
    navigate(`/staff/${staff.id}/password`);
  };

  const handleDeactivate = () => {
    setShowDeactivate(true);
  };

  const confirmDeactivate = () => {
    // demo only
    showToast("For the demo, we only show this confirmation.");
    setShowDeactivate(false);
  };

  // ------- render -------

  return (
    <StaffAdminLayout>
      {/* Toast */}
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

      <main className="staff-main">
        <div className="staff-page-header">
          <button className="btn-secondary" onClick={handleBack}>
            ← Back to Staff
          </button>
          <h1 className="staff-page-title">Employee Profile</h1>
          <div style={{ width: 120 }} />
        </div>

        <div className="staff-card">
          {/* top row: avatar + name + actions */}
          <div className="profile-header">
            <div className="profile-avatar">{avatarInitial}</div>

            <div className="profile-main-info">
              <span className="profile-name">
                {fullName || "(No name set)"}
              </span>
              <span className="profile-role">{roleName}</span>
              {joinedText && (
                <span className="profile-meta">{joinedText}</span>
              )}
            </div>

            <div className="profile-actions">
              <button
                className="btn-secondary"
                type="button"
                onClick={() => setEditing((prev) => !prev)}
              >
                {editing ? "Cancel Edit" : "Edit Profile"}
              </button>
              <button
                className="btn-secondary"
                type="button"
                onClick={handleChangePassword}
              >
                Change Password
              </button>
              <button
                className="btn-secondary"
                style={{ borderColor: "#fecaca", color: "#b91c1c" }}
                type="button"
                onClick={handleDeactivate}
              >
                Deactivate Account
              </button>
            </div>
          </div>

          {/* form grid: personal info + work schedule */}
          <form className="staff-form" onSubmit={handleSave}>
            {/* LEFT COLUMN */}
            <section className="staff-form-section">
              <h2>Personal Information</h2>

              <div className="staff-field">
                <label>First Name</label>
                <input
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  disabled={!editing}
                  className={
                    errors.first_name
                      ? "staff-input staff-input-error"
                      : "staff-input"
                  }
                />
                {errors.first_name && (
                  <span className="staff-error-text">{errors.first_name}</span>
                )}
              </div>

              <div className="staff-field">
                <label>Last Name</label>
                <input
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  disabled={!editing}
                  className={
                    errors.last_name
                      ? "staff-input staff-input-error"
                      : "staff-input"
                  }
                />
                {errors.last_name && (
                  <span className="staff-error-text">{errors.last_name}</span>
                )}
              </div>

              <div className="staff-field">
                <label>Username</label>
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  disabled={!editing}
                  className={
                    errors.username
                      ? "staff-input staff-input-error"
                      : "staff-input"
                  }
                />
                {errors.username && (
                  <span className="staff-error-text">{errors.username}</span>
                )}
              </div>

              <div className="staff-field">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  disabled={!editing}
                  className={
                    errors.email
                      ? "staff-input staff-input-error"
                      : "staff-input"
                  }
                />
                {errors.email && (
                  <span className="staff-error-text">{errors.email}</span>
                )}
              </div>

              <div className="staff-field">
                <label>Phone</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  disabled={!editing}
                  className={
                    errors.phone
                      ? "staff-input staff-input-error"
                      : "staff-input"
                  }
                />
                {errors.phone && (
                  <span className="staff-error-text">{errors.phone}</span>
                )}
              </div>

              <div className="staff-field">
                <label>Address</label>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  disabled={!editing}
                  className="staff-input"
                />
              </div>

              <div className="staff-field">
                <label>Role</label>
                <select
                  name="role_id"
                  value={form.role_id}
                  onChange={handleChange}
                  disabled={!editing}
                  className={
                    errors.role_id
                      ? "staff-input staff-input-error"
                      : "staff-input"
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
                  <span className="staff-error-text">{errors.role_id}</span>
                )}
              </div>
            </section>

            {/* RIGHT COLUMN */}
            <section className="staff-form-section">
              <h2>Work Schedule</h2>

              <div className="staff-field">
                <label>Availability</label>
                <select
                  name="availability"
                  value={form.availability}
                  onChange={handleChange}
                  disabled={!editing}
                  className="staff-input"
                >
                  <option value="">Select availability</option>
                  {availabilityOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="staff-field">
                <label>Days Available</label>
                <select
                  name="days_available"
                  value={form.days_available}
                  onChange={handleChange}
                  disabled={!editing}
                  className={
                    errors.days_available
                      ? "staff-input staff-input-error"
                      : "staff-input"
                  }
                >
                  <option value="">Select days</option>
                  {daysPresetOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                  <option value="Custom">Custom</option>
                </select>

                {form.days_available === "Custom" && (
                  <input
                    type="text"
                    className="staff-input"
                    placeholder="Enter custom days (e.g. Mon, Wed, Fri)"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    disabled={!editing}
                    style={{ marginTop: 6 }}
                  />
                )}

                {errors.days_available && (
                  <span className="staff-error-text">
                    {errors.days_available}
                  </span>
                )}
              </div>

              <div className="staff-field">
                <label>Hours</label>
                <select
                  name="hours"
                  value={form.hours}
                  onChange={handleChange}
                  disabled={!editing}
                  className={
                    errors.hours
                      ? "staff-input staff-input-error"
                      : "staff-input"
                  }
                >
                  <option value="">Select hours</option>
                  {hoursPresetOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                  <option value="Custom">Custom</option>
                </select>

                {form.hours === "Custom" && (
                  <input
                    type="text"
                    className="staff-input"
                    placeholder="Enter custom hours (e.g. 2:00 PM – 8:00 PM)"
                    value={customHours}
                    onChange={(e) => setCustomHours(e.target.value)}
                    disabled={!editing}
                    style={{ marginTop: 6 }}
                  />
                )}

                {errors.hours && (
                  <span className="staff-error-text">{errors.hours}</span>
                )}
              </div>
            </section>

            {/* actions row */}
            <div className="staff-form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleBack}
              >
                Back to Staff
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={!editing || saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Deactivate confirm modal */}
      {showDeactivate && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.45)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 50,
          }}
        >
          <div
            className="staff-card"
            style={{ width: 380, textAlign: "center" }}
          >
            <h2 style={{ fontSize: 18, marginBottom: 8 }}>
              Deactivate this account?
            </h2>
            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 16 }}>
              This is a demo confirmation. In a real app this would disable the
              staff login.
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowDeactivate(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ backgroundColor: "#b91c1c" }}
                onClick={confirmDeactivate}
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </StaffAdminLayout>
  );
}
