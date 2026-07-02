import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const isAuthed = Boolean(localStorage.getItem('dfit_token'));
  const investigatorName = localStorage.getItem('dfit_name');

  function handleLogout() {
    localStorage.removeItem('dfit_token');
    localStorage.removeItem('dfit_name');
    navigate('/login');
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="mono navbar-logo">DFIT</span>
          <span className="evidence-tag navbar-tagline">Evidence Chain Intact</span>
        </Link>

        {isAuthed && (
          <div className="navbar-actions">
            {investigatorName && <span className="navbar-username">{investigatorName}</span>}
            <button className="btn" onClick={handleLogout}>
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}