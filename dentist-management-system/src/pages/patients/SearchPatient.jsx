// src/pages/patients/SearchPatient.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/sidebar/sidebar";
import { Search, ChevronDown, Loader2 } from "lucide-react";

const API_BASE = "http://127.0.0.1:5000/api";

export default function PatientsList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🔹 Modal state
  const [modal, setModal] = useState({
    open: false,
    type: "", // confirm | success | error
    message: "",
    patientId: null,
  });

  // 🔹 Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: "dateAdded",
    direction: "desc",
  });

  useEffect(() => {
    fetchPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/patients`);
      if (!res.ok) throw new Error("Failed to fetch patients");
      const data = await res.json();

      const apptsRes = await fetch(`${API_BASE}/appointments`);
      const apptsData = apptsRes.ok ? await apptsRes.json() : [];

      const patientsWithDetails = await Promise.all(
        data.map(async (patient) => {
          let billingData = null;
          try {
            const billingRes = await fetch(
              `${API_BASE}/patients/${patient.id}/billing-summary`
            );
            billingData = billingRes.ok ? await billingRes.json() : null;
          } catch {}

          const patientAppts = apptsData
            .filter(
              (a) =>
                a.patient_id === patient.id && a.status === "scheduled"
            )
            .sort(
              (a, b) =>
                new Date(a.date + " " + a.time) -
                new Date(b.date + " " + b.time)
            );

          return {
            id: patient.id,
            name: patient.name,
            email: patient.email || "N/A",
            nextAppointment: patientAppts[0]
              ? patientAppts[0].date
              : "None scheduled",
            outstandingBalance: billingData?.outstanding || 0,
            dateAdded: patient.dateAdded
              ? new Date(patient.dateAdded)
              : new Date(), // fallback to now if not provided
          };
        })
      );

      setPatients(patientsWithDetails);
      setError("");
    } catch {
      setError("Failed to load patients. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPatient = () => {
    navigate("/add-patient");
  };

  const handleView = (patientId) => {
    navigate(`/patients/${patientId}`);
  };

  // 🔹 Open confirm modal
  const handleDeleteClick = (patientId) => {
    setModal({
      open: true,
      type: "confirm",
      message:
        "Are you sure you want to delete this patient? This action cannot be undone.",
      patientId,
    });
  };

  // 🔹 Delete logic
  const confirmDelete = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/patients/${modal.patientId}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error();

      setModal({
        open: true,
        type: "success",
        message: "Patient deleted successfully.",
        patientId: null,
      });

      fetchPatients();
    } catch {
      setModal({
        open: true,
        type: "error",
        message: "Failed to delete patient.",
        patientId: null,
      });
    }
  };

  // 🔹 Filter patients by search query (name + email only)
  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 🔹 Sort patients based on sortConfig
  const sortedPatients = [...filteredPatients].sort((a, b) => {
    const { key, direction } = sortConfig;

    if (key === "name") {
      return direction === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (key === "dateAdded") {
      return direction === "asc"
        ? new Date(a.dateAdded) - new Date(b.dateAdded)
        : new Date(b.dateAdded) - new Date(a.dateAdded);
    } else if (key === "balance") {
      return direction === "asc"
        ? a.outstandingBalance - b.outstandingBalance
        : b.outstandingBalance - a.outstandingBalance;
    }

    return 0;
  });

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
              <p className="text-gray-500 mt-1">
                {patients.length} total patient{patients.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={handleAddPatient}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Patient
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="p-6">
              <div className="relative mb-4">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search patients by name or email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-4">
                <FilterButton
                  label="Name"
                  sortKey="name"
                  sortConfig={sortConfig}
                  setSortConfig={setSortConfig}
                />
                <FilterButton
                  label="Date added"
                  sortKey="dateAdded"
                  sortConfig={sortConfig}
                  setSortConfig={setSortConfig}
                />
                <FilterButton
                  label="Balance"
                  sortKey="balance"
                  sortConfig={sortConfig}
                  setSortConfig={setSortConfig}
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-blue-600" size={32} />
                <span className="ml-3 text-gray-600">Loading patients...</span>
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-t border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-600 uppercase">
                        Patient Name
                      </th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-600 uppercase">
                        Next Appointment
                      </th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-600 uppercase">
                        Outstanding Balance
                      </th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-600 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {sortedPatients.map((patient, index) => (
                      <tr
                        key={patient.id}
                        className={`hover:bg-gray-50 ${
                          index !== sortedPatients.length - 1 ? "border-b" : ""
                        }`}
                      >
                        <td className="py-4 px-6 font-medium">{patient.name}</td>
                        <td className="py-4 px-6">{patient.nextAppointment}</td>
                        <td className="py-4 px-6">
                          <span
                            className={
                              patient.outstandingBalance > 0
                                ? "text-red-600"
                                : "text-green-600"
                            }
                          >
                            ${patient.outstandingBalance.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => handleView(patient.id)}
                            className="text-blue-600 hover:text-blue-800 font-medium mr-3"
                          >
                            View
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => handleDeleteClick(patient.id)}
                            className="text-red-600 hover:text-red-800 font-medium ml-3"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 🔔 MODAL */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <p className="text-gray-700 mb-6">{modal.message}</p>

            <div className="flex justify-end gap-3">
              {modal.type === "confirm" && (
                <button
                  onClick={() => setModal({ open: false })}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => {
                  if (modal.type === "confirm") confirmDelete();
                  else setModal({ open: false });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 🔹 FilterButton Component
function FilterButton({ label, sortKey, sortConfig, setSortConfig }) {
  const isActive = sortConfig.key === sortKey;
  const direction = isActive ? sortConfig.direction : "asc";

  const handleClick = () => {
    setSortConfig({
      key: sortKey,
      direction: isActive ? (direction === "asc" ? "desc" : "asc") : "asc",
    });
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
    >
      {label}
      <ChevronDown
        size={16}
        className={isActive ? (direction === "asc" ? "rotate-180" : "") : ""}
      />
    </button>
  );
}
