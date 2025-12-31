import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/sidebar/sidebar';

export default function AddPatient() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phoneNumber: '',
    email: '',
    address: '',
    insuranceProvider: '',
    policyNumber: '',
    groupNumber: ''
  });

  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    // Basic validation
    if (!formData.firstName || !formData.lastName) {
      setMessage("First name and last name are required");
      return;
    }

    const payload = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      date_of_birth: formData.dateOfBirth,
      gender: formData.gender,
      phone: formData.phoneNumber,
      email: formData.email,
      address: formData.address,
      insurance_provider: formData.insuranceProvider,
      insurance_policy_number: formData.policyNumber,
      group_number: formData.groupNumber
    };

    setIsSubmitting(true);

    try {
      const res = await fetch("http://127.0.0.1:5000/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      let data;
      try {
        data = await res.json(); // Try parsing JSON
      } catch (jsonError) {
        console.error("Failed to parse JSON:", jsonError);
        const text = await res.text(); // fallback: get raw text
        console.error("Raw response:", text);
        setMessage(`Backend returned invalid JSON: ${text}`);
        setIsSubmitting(false);
        return;
      }

      if (!res.ok) {
        console.error("Backend error:", data);
        setMessage(data.error || `Error ${res.status}: ${res.statusText}`);
        setIsSubmitting(false);
        return;
      }

      console.log("Patient added successfully:", data);
      setMessage("Patient added successfully! Redirecting...");

      setTimeout(() => {
        navigate('/patients');
      }, 1500);

    } catch (error) {
      console.error("Network or server error:", error);
      setMessage(`Request failed: ${error.message}`);
      setIsSubmitting(false);
    }
  };


  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      navigate('/patients');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-8">

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Add New Patient</h1>
            <p className="text-gray-500">Enter patient information and medical details</p>

            {message && (
              <p className={`mt-3 font-semibold ${
                message.includes('success') ? 'text-green-600' : 'text-red-600'
              }`}>
                {message}
              </p>
            )}
          </div>

          {/* Patient Details Form */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Patient Details</h2>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full text-gray-800 bg-white px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="w-full text-gray-800 bg-white px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full text-gray-800 bg-white px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full text-gray-800 bg-white px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full text-gray-800 bg-white px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full text-gray-800 bg-white px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-600 mb-2">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full text-gray-800 bg-white px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Insurance */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Insurance Information</h2>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Insurance Provider
                </label>
                <input
                  type="text"
                  name="insuranceProvider"
                  value={formData.insuranceProvider}
                  onChange={handleInputChange}
                  className="w-full text-gray-800 bg-white px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Policy Number
                </label>
                <input
                  type="text"
                  name="policyNumber"
                  value={formData.policyNumber}
                  onChange={handleInputChange}
                  className="w-full text-gray-800 bg-white px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-600 mb-2">Group Number</label>
              <input
                type="text"
                name="groupNumber"
                value={formData.groupNumber}
                onChange={handleInputChange}
                className="w-full text-gray-800 bg-white px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 mt-8">
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-6 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-6 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Patient'}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}