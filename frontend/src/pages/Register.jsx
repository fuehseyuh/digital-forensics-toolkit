import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/client.js';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.register(fullName, email, password);
      localStorage.setItem('dfit_token', data.token);
      localStorage.setItem('dfit_name', data.investigator.full_name);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 380, margin: '60px auto' }}>
      <div className="card" style={{ padding: 32 }}>
        <span className="evidence-tag">New Investigator</span>
        <h1 style={{ fontSize: 22, margin: '16px 0 4px' }}>Create your account</h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-dim)', marginBottom: 24 }}>
          Every action you take will be recorded to the chain of custody.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--color-text-dim)', display: 'block', marginBottom: 6 }}>
              Full name
            </label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--color-text-dim)', display: 'block', marginBottom: 6 }}>
              Email
            </label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--color-text-dim)', display: 'block', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          {error && <p style={{ color: 'var(--color-tag-red-bright)', fontSize: 13 }}>{error}</p>}

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ justifyContent: 'center' }}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p style={{ fontSize: 13, color: 'var(--color-text-dim)', marginTop: 20 }}>
          Already registered? <Link to="/login" style={{ color: 'var(--color-verified)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
