import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AddPatient from './pages/patients/AddPatient.jsx';
import Appointment from './pages/patients/PatientAppointment.jsx'; 
import PatientInvoices from './pages/patients/PatientInvoices.jsx';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/p" element={<AddPatient />} />
        <Route path="/a" element={<Appointment />} /> 
        <Route path="/" element={<PatientInvoices />} /> 

      </Routes>
    </BrowserRouter>
  );
}

export default App;