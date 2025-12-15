import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import { FiUser, FiBell, FiLock, FiCamera, FiLogOut } from "react-icons/fi";
import "./settings.css";

const API_BASE = "http://127.0.0.1:5000";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("profile");

  // Get staff_id from localStorage currentUser
  const getCurrentUser = () => {
    try {
      const userStr = localStorage.getItem("currentUser");
      if (!userStr) return null;
      return JSON.parse(userStr);
    } catch (err) {
      console.error("Failed to parse currentUser:", err);
      return null;
    }
  };

  // Initialize currentUser safely
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const staffId = currentUser?.staff_id || currentUser?.id;

  // Profile data
  const [profileData, setProfileData] = useState({
    username: "",
    full_name: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    profile_photo: "",
  });

  // Password change
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    appointment_reminders: true,
    low_stock_alerts: true,
    patient_updates: true,
    billing_alerts: true,
    staff_updates: false,
    email_notifications: true,
    sms_notifications: false,
  });

  useEffect(() => {
    if (!staffId) {
      setError("No staff ID found. Please log in again.");
      setLoading(false);
      setTimeout(() => navigate("/login"), 2000);
      return;
    }
    
    fetchStaffData();
  }, [staffId, navigate]);

  const fetchStaffData = async () => {
    try {
      setError("");
      
      console.log("Fetching staff data for ID:", staffId);
      
      const res = await fetch(`${API_BASE}/api/staff/${staffId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      console.log("Response status:", res.status);
      
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Staff profile not found");
        } else if (res.status === 500) {
          throw new Error("Server error. Please try again later.");
        } else {
          throw new Error(`Failed to load profile (${res.status})`);
        }
      }
      
      const data = await res.json();
      console.log("Staff data loaded:", data);
      
      setProfileData({
        username: data.username || "",
        full_name: data.full_name || "",
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        email: data.email || "",
        phone: data.phone || "",
        profile_photo: data.profile_photo || "",
      });

      if (data.notification_preferences && Array.isArray(data.notification_preferences)) {
        const prefs = {};
        data.notification_preferences.forEach(pref => {
          if (typeof pref === 'object') {
            Object.assign(prefs, pref);
          }
        });
        if (Object.keys(prefs).length > 0) {
          setNotifications(prev => ({ ...prev, ...prefs }));
        }
      } else if (data.notification_preferences && typeof data.notification_preferences === 'object') {
        setNotifications(prev => ({ ...prev, ...data.notification_preferences }));
      }

      const updatedUser = { ...currentUser, ...data, staff_id: data.id };
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      
    } catch (err) {
      console.error("Error fetching staff data:", err);
      setError(err.message || "Failed to load settings. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("staff_id");
      localStorage.removeItem("username");
      localStorage.removeItem("role");
      navigate("/login");
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotifications((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    if (!profileData.email || !profileData.email.includes("@")) {
      setError("Please enter a valid email address");
      setSaving(false);
      return;
    }

    if (!profileData.username || profileData.username.trim() === "") {
      setError("Username is required");
      setSaving(false);
      return;
    }

    if (!profileData.full_name || profileData.full_name.trim() === "") {
      setError("Full name is required");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/staff/${staffId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: profileData.username,
          full_name: profileData.full_name,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          email: profileData.email,
          phone: profileData.phone,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      const updatedData = await res.json();
      
      const updatedUser = { ...currentUser, ...updatedData, staff_id: updatedData.id };
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err.message || "An error occurred while updating profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    if (!passwordData.current_password) {
      setError("Current password is required");
      setSaving(false);
      return;
    }

    if (!passwordData.new_password || passwordData.new_password.length < 8) {
      setError("New password must be at least 8 characters");
      setSaving(false);
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError("New passwords do not match");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/staff/${staffId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          password: passwordData.new_password,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update password");
      }

      setSuccess("Password updated successfully! Please login again with your new password.");
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      
      setTimeout(() => {
        localStorage.removeItem("currentUser");
        localStorage.removeItem("staff_id");
        localStorage.removeItem("username");
        localStorage.removeItem("role");
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error("Password update error:", err);
      setError(err.message || "An error occurred while updating password");
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await fetch(`${API_BASE}/api/staff/${staffId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notification_preferences: JSON.stringify(notifications),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update notifications");
      }

      setSuccess("Notification preferences updated!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Notification update error:", err);
      setError(err.message || "An error occurred while updating notifications");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setError("");
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const res = await fetch(`${API_BASE}/api/staff/${staffId}/photo`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to upload photo");
      }

      const data = await res.json();
      const photoUrl = `${API_BASE}${data.photo_url}`;
      
      setProfileData((prev) => ({
        ...prev,
        profile_photo: photoUrl,
      }));

      const updatedUser = { ...currentUser, profile_photo: photoUrl };
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      setSuccess("Profile photo updated!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Photo upload error:", err);
      setError(err.message || "Failed to upload photo");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="app-main">
          <div className="page">
            <p style={{ textAlign: "center", padding: "40px" }}>Loading settings...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <div className="page">
          <header className="page-header">
            <h1>Settings</h1>
            <button 
              className="secondary-button"
              onClick={handleLogout}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <FiLogOut /> Logout
            </button>
          </header>

          {/* Tab Navigation */}
          <div className="settings-tabs">
            <button
              className={`tab-button ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              <FiUser /> Profile
            </button>
            <button
              className={`tab-button ${activeTab === "security" ? "active" : ""}`}
              onClick={() => setActiveTab("security")}
            >
              <FiLock /> Security
            </button>
            <button
              className={`tab-button ${activeTab === "notifications" ? "active" : ""}`}
              onClick={() => setActiveTab("notifications")}
            >
              <FiBell /> Notifications
            </button>
          </div>

          <div className="card form-card">
            {error && <div className="error-banner">{error}</div>}
            {success && <div className="success-banner">{success}</div>}

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <form onSubmit={handleProfileSubmit}>
                <h2 className="section-title">Profile Information</h2>

                {/* Profile Photo */}
                <div className="form-group photo-upload-section">
                  <label>Profile Photo</label>
                  <div className="photo-upload-container">
                    <div className="profile-photo-preview">
                      {profileData.profile_photo ? (
                        <img 
                          src={profileData.profile_photo.startsWith('http') ? profileData.profile_photo : `${API_BASE}${profileData.profile_photo}`} 
                          alt="Profile" 
                          onError={(e) => {
                            console.error("Failed to load image:", profileData.profile_photo);
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<div class="photo-placeholder"><FiUser size={48} /></div>';
                          }}
                        />
                      ) : (
                        <div className="photo-placeholder">
                          <FiUser size={48} />
                        </div>
                      )}
                    </div>
                    <div className="photo-upload-controls">
                      <input
                        type="file"
                        id="photo-upload"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        style={{ display: "none" }}
                        disabled={saving}
                      />
                      <label htmlFor="photo-upload" className="secondary-button">
                        <FiCamera /> Change Photo
                      </label>
                      <small style={{ color: "#6b7280", marginTop: "8px" }}>
                        JPG, PNG or GIF. Max size 5MB.
                      </small>
                    </div>
                  </div>
                </div>

                {/* Username */}
                <div className="form-group">
                  <label htmlFor="username">
                    Username <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={profileData.username}
                    onChange={handleProfileChange}
                    required
                  />
                </div>

                {/* Full Name */}
                <div className="form-group">
                  <label htmlFor="full_name">
                    Full Name <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={profileData.full_name}
                    onChange={handleProfileChange}
                    required
                  />
                </div>

                {/* First and Last Name */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="first_name">First Name</label>
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      value={profileData.first_name}
                      onChange={handleProfileChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="last_name">Last Name</label>
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      value={profileData.last_name}
                      onChange={handleProfileChange}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="form-group">
                  <label htmlFor="email">
                    Email <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    required
                  />
                </div>

                {/* Phone */}
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => navigate("/dashboard")}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="primary-button" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <form onSubmit={handlePasswordSubmit}>
                <h2 className="section-title">Change Password</h2>

                <div className="form-group">
                  <label htmlFor="current_password">
                    Current Password <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="password"
                    id="current_password"
                    name="current_password"
                    value={passwordData.current_password}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="new_password">
                    New Password <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="password"
                    id="new_password"
                    name="new_password"
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    required
                  />
                  <small style={{ color: "#6b7280" }}>
                    Must be at least 8 characters long
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="confirm_password">
                    Confirm New Password <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="password"
                    id="confirm_password"
                    name="confirm_password"
                    value={passwordData.confirm_password}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setPasswordData({
                        current_password: "",
                        new_password: "",
                        confirm_password: "",
                      });
                      setError("");
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="primary-button" disabled={saving}>
                    {saving ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <form onSubmit={handleNotificationSubmit}>
                <h2 className="section-title">Notification Preferences</h2>

                <div className="notification-section">
                  <h3 className="subsection-title">System Notifications</h3>
                  
                  <div className="notification-item">
                    <div className="notification-info">
                      <label htmlFor="appointment_reminders">Appointment Reminders</label>
                      <p className="notification-description">
                        Get notified about upcoming appointments
                      </p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        id="appointment_reminders"
                        name="appointment_reminders"
                        checked={notifications.appointment_reminders}
                        onChange={handleNotificationChange}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="notification-item">
                    <div className="notification-info">
                      <label htmlFor="low_stock_alerts">Low Stock Alerts</label>
                      <p className="notification-description">
                        Alerts when inventory items are running low
                      </p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        id="low_stock_alerts"
                        name="low_stock_alerts"
                        checked={notifications.low_stock_alerts}
                        onChange={handleNotificationChange}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="notification-item">
                    <div className="notification-info">
                      <label htmlFor="patient_updates">Patient Updates</label>
                      <p className="notification-description">
                        Notifications about patient record changes
                      </p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        id="patient_updates"
                        name="patient_updates"
                        checked={notifications.patient_updates}
                        onChange={handleNotificationChange}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="notification-item">
                    <div className="notification-info">
                      <label htmlFor="billing_alerts">Billing Alerts</label>
                      <p className="notification-description">
                        Updates about invoices and payments
                      </p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        id="billing_alerts"
                        name="billing_alerts"
                        checked={notifications.billing_alerts}
                        onChange={handleNotificationChange}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="notification-item">
                    <div className="notification-info">
                      <label htmlFor="staff_updates">Staff Updates</label>
                      <p className="notification-description">
                        Notifications about staff schedule changes
                      </p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        id="staff_updates"
                        name="staff_updates"
                        checked={notifications.staff_updates}
                        onChange={handleNotificationChange}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="notification-section">
                  <h3 className="subsection-title">Delivery Methods</h3>
                  
                  <div className="notification-item">
                    <div className="notification-info">
                      <label htmlFor="email_notifications">Email Notifications</label>
                      <p className="notification-description">
                        Receive notifications via email
                      </p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        id="email_notifications"
                        name="email_notifications"
                        checked={notifications.email_notifications}
                        onChange={handleNotificationChange}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="notification-item">
                    <div className="notification-info">
                      <label htmlFor="sms_notifications">SMS Notifications</label>
                      <p className="notification-description">
                        Receive notifications via text message
                      </p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        id="sms_notifications"
                        name="sms_notifications"
                        checked={notifications.sms_notifications}
                        onChange={handleNotificationChange}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => navigate("/dashboard")}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="primary-button" disabled={saving}>
                    {saving ? "Saving..." : "Save Preferences"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}