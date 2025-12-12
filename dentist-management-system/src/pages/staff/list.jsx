import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchStaff, deleteStaff } from "../../services/staffApi";
import StaffAdminLayout from "../../components/StaffAdminLayout";
import "../../styles/staff.css";
import Sidebar from "../../components/Sidebar/Sidebar";

const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem("currentUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export default function StaffListPage() {
  const navigate = useNavigate();

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState({
    visible: false,
    type: "success",
    message: "",
  });

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ visible: true, type, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  // ✅ Check if current user is admin
  useEffect(() => {
    const user = getCurrentUser();
    if (!user || !user.is_admin) {
      setIsAdmin(false);
      showToast("You don't have permission to view staff.", "error");
    } else {
      setIsAdmin(true);
    }
    setAuthChecked(true);
  }, []);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const data = await fetchStaff();
      setStaff(data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load staff", "error");
    } finally {
      setLoading(false);
    }
  };

  // Only load staff if admin
  useEffect(() => {
    if (!isAdmin) return;
    loadStaff();
  }, [isAdmin]);

  const confirmDelete = (id) => {
    setDeleteTarget(id);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteStaff(deleteTarget);
      setDeleteTarget(null);
      showToast("Employee deleted");
      await loadStaff();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete employee", "error");
    }
  };

  // ⏳ While checking auth
  if (!authChecked) {
    return (
      <StaffAdminLayout>
        <div className="staff-main">
          <p>Loading...</p>
        </div>
      </StaffAdminLayout>
    );
  }

  // 🚫 Not admin → access denied card
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
              You do not have permission to manage staff. Please contact an
              administrator if you think this is a mistake.
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

  // ✅ Admin view (original UI)
  return (
    <div className="app-layout">
      <Sidebar />
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

      <div className="staff-page-header">
        <h1 className="staff-page-title">Staff Management</h1>
        <a href="/staff/add" className="btn-primary">
          Add New Employee
        </a>
      </div>

      <div className="staff-card">
        {loading ? (
          <p>Loading...</p>
        ) : staff.length === 0 ? (
          <p>No staff yet.</p>
        ) : (
          <table className="staff-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Schedule</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id}>
                  <td>
                    {s.first_name} {s.last_name}
                  </td>
                  <td>{s.role_name}</td>
                  <td>
                    {s.days_available || "-"}
                    {s.hours ? `, ${s.hours}` : ""}
                  </td>
                  <td>
                    <a href={`/staff/${s.id}`} style={{ marginRight: 12 }}>
                      View
                    </a>
                    <button
                      className="link-button"
                      type="button"
                      onClick={() => confirmDelete(s.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete confirm modal */}
      {deleteTarget && (
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
            style={{ width: 360, textAlign: "center" }}
          >
            <h2 style={{ fontSize: 18, marginBottom: 8 }}>Delete employee?</h2>
            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 16 }}>
              This action cannot be undone.
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <button
                className="btn-secondary"
                type="button"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                type="button"
                style={{ backgroundColor: "#b91c1c" }}
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </StaffAdminLayout>
    </div>
  );
}
