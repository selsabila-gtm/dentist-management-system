import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AddPatient from './pages/patients/AddPatient.jsx';
import Appointment from './pages/patients/PatientAppointment.jsx'; 
import PatientInvoices from './pages/patients/PatientInvoices.jsx';
import SearchPatient from './pages/patients/SearchPatient.jsx';
import ViewPatient from './pages/patients/ViewPatient.jsx';



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/a" element={<AddPatient />} />
        <Route path="/b" element={<Appointment />} /> 
        <Route path="/c" element={<PatientInvoices />} /> 
        <Route path="/" element={<SearchPatient />} /> 
        <Route path="/d" element={<ViewPatient />} /> 


      </Routes>
    </BrowserRouter>
  );
}

export default App;