import { useEffect, useState } from "react";
import { fetchStaff, deleteStaff } from "../../services/staffApi";
import StaffLayout from "../../components/StaffLayout";
import Sidebar from "../../components/Sidebar/Sidebar";
import "../../styles/staff.css";

export default function StaffListPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const data = await fetchStaff();
      setStaff(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this employee?")) return;
    try {
      await deleteStaff(id);
      await loadStaff();
    } catch (err) {
      console.error(err);
      alert("Failed to delete employee");
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
    <StaffLayout>
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
                  <td>{s.first_name} {s.last_name}</td>
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
                      onClick={() => handleDelete(s.id)}
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
    </StaffLayout>
    </div>
  );
}
