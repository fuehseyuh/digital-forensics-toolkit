import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { caseApi, evidenceApi } from '../api/client.js';

export default function CaseDetail() {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadCase();
  }, [id]);

  async function loadCase() {
    setLoading(true);
    try {
      const { data } = await caseApi.get(id);
      setCaseData(data);
    } catch (err) {
      setError('Failed to load case.');
    } finally {
      setLoading(false);
    }
  }

  async function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setError('');
    try {
      await evidenceApi.upload(id, file, (evt) => {
        setProgress(Math.round((evt.loaded * 100) / evt.total));
      });
      await loadCase();
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  if (loading) return <p style={{ color: 'var(--color-text-dim)' }}>Loading case…</p>;
  if (!caseData) return <p>Case not found.</p>;

  return (
    <div>
      <Link to="/" style={{ fontSize: 13, color: 'var(--color-text-dim)', textDecoration: 'none' }}>
        ← Back to registry
      </Link>

      <div style={{ margin: '16px 0 24px' }}>
        <span className="evidence-tag mono">{caseData.case_reference}</span>
        <h1 style={{ fontSize: 26, margin: '10px 0 6px' }}>{caseData.title}</h1>
        {caseData.description && (
          <p style={{ color: 'var(--color-text-dim)', fontSize: 14 }}>{caseData.description}</p>
        )}
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Log new evidence</div>
            <p style={{ fontSize: 13, color: 'var(--color-text-dim)' }}>
              File will be hashed (MD5 / SHA-1 / SHA-256), checked for signature mismatches, and metadata extracted automatically.
            </p>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              id="evidence-upload"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <label htmlFor="evidence-upload" className="btn btn-primary" style={{ opacity: uploading ? 0.6 : 1 }}>
              {uploading ? `Processing… ${progress}%` : 'Upload evidence file'}
            </label>
          </div>
        </div>
      </div>

      {error && <p style={{ color: 'var(--color-tag-red-bright)', fontSize: 13 }}>{error}</p>}

      <div className="perforation" />

      <span className="evidence-tag" style={{ marginBottom: 12, display: 'inline-flex' }}>
        {caseData.evidence.length} evidence item{caseData.evidence.length === 1 ? '' : 's'}
      </span>

      {caseData.evidence.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: 'center', marginTop: 12 }}>
          <p style={{ color: 'var(--color-text-dim)' }}>No evidence logged yet for this case.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          {caseData.evidence.map((ev) => (
            <Link
              key={ev.evidence_id}
              to={`/evidence/${ev.evidence_id}`}
              className="card"
              style={{
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{ev.original_filename}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-faint)' }}>
                  {formatBytes(ev.file_size_bytes)} · {ev.mime_type_detected} · uploaded{' '}
                  {new Date(ev.uploaded_at).toLocaleString()}
                </div>
              </div>
              {ev.signature_mismatch ? (
                <span className="evidence-tag tag-warning">Signature mismatch</span>
              ) : (
                <span className="evidence-tag tag-verified">Signature OK</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
