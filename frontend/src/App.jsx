import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CaseDetail from './pages/CaseDetail.jsx';
import EvidenceDetail from './pages/EvidenceDetail.jsx';

function isAuthenticated() {
  return Boolean(localStorage.getItem('dfit_token'));
}

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cases/:id"
            element={
              <ProtectedRoute>
                <CaseDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/evidence/:evidenceId"
            element={
              <ProtectedRoute>
                <EvidenceDetail />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </>
  );
}
