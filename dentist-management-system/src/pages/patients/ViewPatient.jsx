import React, { useState } from 'react';

export default function ViewPatient() {
  const [activeTab, setActiveTab] = useState('General Info');

  const tabs = [
    'General Info',
    'Appointments',
    'Treatment Plans',
    'Medical Records',
    'Prescriptions',
    'Invoices/Payments'
  ];

  // Hardcoded patient data
  const patientData = {
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1985-07-20',
    gender: 'Male',
    phoneNumber: '+1 234 567 890',
    email: 'john.doe@example.com',
    address: '123 Main St, Springfield',
    insuranceProvider: 'HealthCare Inc.',
    policyNumber: 'POL1234567',
    groupNumber: 'GRP987654'
  };

  return (
    <div className="flex h-screen bg-gray-50">

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Patient Profile</h1>
            <p className="text-gray-500">View patient information and history</p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-8">
            <div className="flex gap-8">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 px-1 bg-white font-medium transition-colors ${
                    activeTab === tab
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-600'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Patient Details */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Patient Details</h2>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-500">First Name</p>
                <p className="text-gray-800 font-medium">{patientData.firstName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Name</p>
                <p className="text-gray-800 font-medium">{patientData.lastName}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-500">Date of Birth</p>
                <p className="text-gray-800 font-medium">{patientData.dateOfBirth}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Gender</p>
                <p className="text-gray-800 font-medium">{patientData.gender}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-500">Phone Number</p>
                <p className="text-gray-800 font-medium">{patientData.phoneNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-gray-800 font-medium">{patientData.email}</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-500">Address</p>
              <p className="text-gray-800 font-medium">{patientData.address}</p>
            </div>
          </div>

          {/* Insurance Information */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Insurance Information</h2>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-500">Insurance Provider</p>
                <p className="text-gray-800 font-medium">{patientData.insuranceProvider}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Policy Number</p>
                <p className="text-gray-800 font-medium">{patientData.policyNumber}</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-500">Group Number</p>
              <p className="text-gray-800 font-medium">{patientData.groupNumber}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
