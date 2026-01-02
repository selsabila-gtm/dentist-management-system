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

  const [fieldErrors, setFieldErrors] = useState({}); // 🔹 Inline field errors
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔹 Modal state for success / cancel
  const [modal, setModal] = useState({
    open: false,
    type: '', // success | error | confirm
    title: '',
    message: '',
    onConfirm: null,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear inline error when user types
    setFieldErrors(prev => ({ ...prev, [name]: '' }));
  };

  // ✅ Validation helpers
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidAlgerianPhone = (phone) => /^(?:\+213|0)(5|6|7)\d{8}$/.test(phone);

  const validateFields = () => {
    const errors = {};

    if (!formData.firstName) errors.firstName = 'First name is required.';
    if (!formData.lastName) errors.lastName = 'Last name is required.';
    if (formData.email && !isValidEmail(formData.email)) {
      errors.email = 'Enter a valid email address.';
    }
    if (formData.phoneNumber && !isValidAlgerianPhone(formData.phoneNumber)) {
      errors.phoneNumber = 'Enter a valid Algerian phone number.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateFields()) return; // stop submission if field errors

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
      const res = await fetch('http://127.0.0.1:5000/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        setModal({
          open: true,
          type: 'error',
          title: 'Error',
          message: data.error || 'Failed to add patient.',
        });
        setIsSubmitting(false);
        return;
      }

      // ✅ Success modal
      setModal({
        open: true,
        type: 'success',
        title: 'Patient Added',
        message: 'The patient was added successfully.',
        onConfirm: () => navigate('/patients'),
      });

    } catch (error) {
      setModal({
        open: true,
        type: 'error',
        title: 'Network Error',
        message: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setModal({
      open: true,
      type: 'confirm',
      title: 'Cancel changes?',
      message: 'Any unsaved changes will be lost.',
      onConfirm: () => navigate('/patients'),
    });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 overflow-auto p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Add New Patient</h1>

        {/* Patient Details */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-xl font-semibold mb-6">Patient Details</h2>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <input
                name="firstName"
                placeholder="First Name *"
                value={formData.firstName}
                onChange={handleInputChange}
                className="input"
              />
              {fieldErrors.firstName && <p className="text-red-600 text-sm mt-1">{fieldErrors.firstName}</p>}
            </div>
            <div>
              <input
                name="lastName"
                placeholder="Last Name *"
                value={formData.lastName}
                onChange={handleInputChange}
                className="input"
              />
              {fieldErrors.lastName && <p className="text-red-600 text-sm mt-1">{fieldErrors.lastName}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              className="input"
            />
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              className="input"
            >
              <option value="">Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <input
                name="phoneNumber"
                placeholder="Phone"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="input"
              />
              {fieldErrors.phoneNumber && <p className="text-red-600 text-sm mt-1">{fieldErrors.phoneNumber}</p>}
            </div>
            <div>
              <input
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                className="input"
              />
              {fieldErrors.email && <p className="text-red-600 text-sm mt-1">{fieldErrors.email}</p>}
            </div>
          </div>

          <input
            name="address"
            placeholder="Address"
            value={formData.address}
            onChange={handleInputChange}
            className="input w-full"
          />
        </div>

        {/* Insurance */}
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-xl font-semibold mb-6">Insurance Information</h2>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <input
              name="insuranceProvider"
              placeholder="Insurance Provider"
              value={formData.insuranceProvider}
              onChange={handleInputChange}
              className="input"
            />
            <input
              name="policyNumber"
              placeholder="Policy Number"
              value={formData.policyNumber}
              onChange={handleInputChange}
              className="input"
            />
          </div>

          <input
            name="groupNumber"
            placeholder="Group Number"
            value={formData.groupNumber}
            onChange={handleInputChange}
            className="input w-full"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={handleCancel}
            className="px-6 py-2 border rounded-lg"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg"
          >
            {isSubmitting ? 'Saving...' : 'Save Patient'}
          </button>
        </div>
      </main>

      {/* 🔔 MODAL */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-2">{modal.title}</h2>
            <p className="text-gray-600 mb-6">{modal.message}</p>

            <div className="flex justify-end gap-3">
              {modal.type === 'confirm' && (
                <button
                  onClick={() => setModal({ open: false })}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
              )}

              <button
                onClick={() => {
                  setModal({ open: false });
                  modal.onConfirm && modal.onConfirm();
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded"
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
