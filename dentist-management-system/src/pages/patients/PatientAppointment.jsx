import React, { useState } from 'react';

export default function AppointmentHistory() {
  const [activeTab, setActiveTab] = useState('Appointments');
  
  const appointments = [
    { id: 1, date: '2024-07-20', time: '10:00 AM', dentist: 'Dr. Emily Carter', status: 'scheduled' },
    { id: 2, date: '2024-05-15', time: '2:30 PM', dentist: 'Dr. Emily Carter', status: 'cancelled' },
    { id: 3, date: '2024-03-01', time: '9:00 AM', dentist: 'Dr. Emily Carter', status: 'completed' },
    { id: 4, date: '2024-01-10', time: '11:15 AM', dentist: 'Dr. Emily Carter', status: 'completed' },
    { id: 5, date: '2023-11-22', time: '1:00 PM', dentist: 'Dr. Emily Carter', status: 'completed' }
  ];

  const tabs = [
    'General Info',
    'Appointments',
    'Treatment Plans',
    'Medical Records',
    'Prescriptions',
    'Invoices/Payments'
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-gray-200 text-gray-700';
      case 'completed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleViewDetails = (appointmentId) => {
    console.log('View details for appointment:', appointmentId);
    alert(`Viewing details for appointment ${appointmentId}`);
  };

  const handleAddAppointment = () => {
    console.log('Add new appointment');
    alert('Add Appointment dialog would open here');
  };

  return (
    <div className="flex h-screen bg-gray-50">

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Profile</h1>
            <p className="text-gray-500">Manage patient information and history</p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-8">
            <div className="flex gap-8">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 bg-white px-1 font-medium transition-colors ${
                    activeTab === tab
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Appointment History */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Appointment History</h2>
                <button
                  onClick={handleAddAppointment}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Add Appointment
                </button>
              </div>

              {/* Table */}
              <div className="overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">Date</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">Time</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">Dentist</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">Status</th>
                      <th className="py-4 px-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appointment, index) => (
                      <tr key={appointment.id} className={`${index !== appointments.length - 1 ? 'border-b border-gray-100' : ''}`}>
                        <td className="py-4 px-4 text-sm text-gray-600">{appointment.date}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">{appointment.time}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">{appointment.dentist}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => handleViewDetails(appointment.id)}
                            className="text-sm bg-blue-50 text-gray-600 hover:text-gray-900 transition-colors"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
