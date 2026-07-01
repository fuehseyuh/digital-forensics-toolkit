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
    <header
      style={{
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
        }}
      >
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            className="mono"
            style={{
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: 'var(--color-text)',
            }}
          >
            DFIT
          </span>
          <span className="evidence-tag">Evidence Chain Intact</span>
        </Link>

        {isAuthed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {investigatorName && (
              <span style={{ fontSize: 13, color: 'var(--color-text-dim)' }}>{investigatorName}</span>
            )}
            <button className="btn" onClick={handleLogout}>
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
