// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import Dashboard1 from './Dashboard1';
import Dashboard2 from './Dashboard2'; // create this component separately

// Top bar for switching rooms
function RoomNavBar() {
  const location = useLocation();
  const activeStyle = {
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    marginRight: '10px',
    borderRadius: '1px',
    cursor: 'pointer',
  };
  const inactiveStyle = {
    backgroundColor: '#e0e0e0',
    color: '#333',
    border: 'none',
    padding: '10px 20px',
    marginRight: '10px',
    borderRadius: '1px',
    cursor: 'pointer',
  };

  return (
    <div style={{ padding: '10px', textAlign: 'center', backgroundColor: '#f5f5f5' , justifyContent:'flex-start' , display: 'flex' }}>
      <Link to="/room1">
        <button style={location.pathname === '/room1' ? activeStyle : inactiveStyle}>Room 1</button>
      </Link>
      <Link to="/room2">
        <button style={location.pathname === '/room2' ? activeStyle : inactiveStyle}>Room 2</button>
      </Link>
    </div>
  );
}

function App() {
  return (
    <Router>
      <RoomNavBar />
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
