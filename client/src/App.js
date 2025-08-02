import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import Dashboard1 from './Dashboard1';
import Dashboard2 from './Dashboard2';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/room1" />} />
        <Route path="/room1" element={<Dashboard1 />} />
        <Route path="/room2" element={<Dashboard2 />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;