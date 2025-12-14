import React, { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import Sidebar from "../../components/Sidebar/Sidebar";

export default function PatientsList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  
  const patients = [
    { id: 1, name: 'Sophia Clark', phone: '(555) 123-4567', nextAppointment: '2024-03-15', outstandingBalance: 250 },
    { id: 2, name: 'Ethan Miller', phone: '(555) 987-6543', nextAppointment: '2024-03-20', outstandingBalance: 100 },
    { id: 3, name: 'Olivia Davis', phone: '(555) 246-8013', nextAppointment: '2024-03-22', outstandingBalance: 50 },
    { id: 4, name: 'Liam Wilson', phone: '(555) 369-1470', nextAppointment: '2024-03-25', outstandingBalance: 300 },
    { id: 5, name: 'Ava Taylor', phone: '(555) 789-0123', nextAppointment: '2024-03-28', outstandingBalance: 150 }
  ];

  const handleAddPatient = () => {
    console.log('Add patient');
    alert('Add Patient dialog would open here');
  };

  const handleView = (patientId) => {
    console.log('View patient:', patientId);
    alert(`Viewing patient ${patientId}`);
  };

  const handleDelete = (patientId) => {
    console.log('Delete patient:', patientId);
    if (window.confirm('Are you sure you want to delete this patient?')) {
      alert(`Patient ${patientId} deleted`);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app-layout">
      <Sidebar />
    <div className="flex h-screen bg-gray-50">

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
            <button
              onClick={handleAddPatient}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Add Patient
            </button>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="p-6">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search patients"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="flex gap-4">
                <FilterButton label="Name" />
                <FilterButton label="Date added" />
                <FilterButton label="Age" />
                <FilterButton label="Phone" />
              </div>
            </div>

            <div className="overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-t border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-600 uppercase tracking-wider">Patient Name</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-600 uppercase tracking-wider">Phone</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-600 uppercase tracking-wider">Next Appointment</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-600 uppercase tracking-wider">Outstanding Balance</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredPatients.map((patient, index) => (
                    <tr 
                      key={patient.id}
                      className={`hover:bg-gray-50 transition-colors ${index !== filteredPatients.length - 1 ? 'border-b border-gray-100' : ''}`}
                    >
                      <td className="py-4 px-6 text-sm text-gray-900">{patient.name}</td>
                      <td className="py-4 px-6 text-sm text-gray-600">{patient.phone}</td>
                      <td className="py-4 px-6 text-sm text-gray-600">{patient.nextAppointment}</td>
                      <td className="py-4 px-6 text-sm text-gray-600">${patient.outstandingBalance}</td>
                      <td className="py-4 px-6 text-sm">
                        <button
                          onClick={() => handleView(patient.id)}
                          className="bg-blue-50 text-gray-600 hover:text-gray-900 mr-3"
                        >
                          View
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => handleDelete(patient.id)}
                          className="bg-red-50 text-gray-600 hover:text-gray-900 ml-3"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
    </div>
  );
}

function FilterButton({ label }) {
  return (
    <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
      {label}
      <ChevronDown size={16} />
    </button>
  );
}
