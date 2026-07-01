import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { caseApi } from '../api/client.js';

export default function Dashboard() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadCases();
  }, []);

  async function loadCases() {
    setLoading(true);
    try {
      const { data } = await caseApi.list();
      setCases(data);
    } catch (err) {
      setError('Failed to load cases.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await caseApi.create(title, description);
      setTitle('');
      setDescription('');
      setShowForm(false);
      loadCases();
    } catch (err) {
      setError('Failed to create case.');
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <span className="evidence-tag">Case Registry</span>
          <h1 style={{ fontSize: 26, margin: '10px 0 0' }}>Open cases</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancel' : '+ New case'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card" style={{ padding: 20, marginBottom: 24 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: 'var(--color-text-dim)', display: 'block', marginBottom: 6 }}>
              Case title
            </label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Lost laptop investigation" required />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: 'var(--color-text-dim)', display: 'block', marginBottom: 6 }}>
              Description (optional)
            </label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="submit">Open case</button>
        </form>
      )}

      {error && <p style={{ color: 'var(--color-tag-red-bright)', fontSize: 13 }}>{error}</p>}

      {loading ? (
        <p style={{ color: 'var(--color-text-dim)' }}>Loading cases…</p>
      ) : cases.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-dim)' }}>No cases yet. Open one to start logging evidence.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cases.map((c) => (
            <Link
              key={c.case_id}
              to={`/cases/${c.case_id}`}
              className="card"
              style={{
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--color-text-faint)' }}>
                    {c.case_reference}
                  </span>
                  <StatusTag status={c.status} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{c.title}</div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-dim)' }}>
                {c.evidence_count} item{c.evidence_count === '1' ? '' : 's'}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusTag({ status }) {
  const cls = status === 'open' ? 'tag-verified' : status === 'closed' ? 'tag-warning' : '';
  return <span className={`evidence-tag ${cls}`}>{status}</span>;
}
