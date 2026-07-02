import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { evidenceApi } from '../api/client.js';
import BackLink from '../components/BackLink.jsx';

export default function EvidenceDetail() {
  const { evidenceId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reverifying, setReverifying] = useState(false);
  const [reverifyResult, setReverifyResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, [evidenceId]);

  async function load() {
    setLoading(true);
    try {
      const { data } = await evidenceApi.getDetail(evidenceId);
      setData(data);
    } catch (err) {
      setError('Failed to load evidence.');
    } finally {
      setLoading(false);
    }
  }

  async function handleReverify() {
    setReverifying(true);
    setReverifyResult(null);
    try {
      const { data } = await evidenceApi.reverify(evidenceId);
      setReverifyResult(data);
      load(); // refresh custody trail to show the new log entry
    } catch (err) {
      setError('Re-verification failed.');
    } finally {
      setReverifying(false);
    }
  }

  if (loading) return <p style={{ color: 'var(--color-text-dim)' }}>Loading evidence…</p>;
  if (error) return <p style={{ color: 'var(--color-tag-red-bright)' }}>{error}</p>;
  if (!data) return null;

  const { evidence, hashes, metadata, custodyTrail } = data;
  const fsMeta = metadata.find((m) => m.metadata_type === 'filesystem');
  const exifMeta = metadata.find((m) => m.metadata_type === 'exif');

  return (
    <div>
      <BackLink to={`/cases/${evidence.case_id}`}>Back to case</BackLink>

      <div style={{ marginBottom: 24, marginTop: 16 }}>
        <span className="evidence-tag">Evidence Record</span>
        <h1 style={{ fontSize: 24, margin: '10px 0 6px' }}>{evidence.original_filename}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {evidence.signature_mismatch ? (
            <span className="evidence-tag tag-warning">Signature mismatch flagged</span>
          ) : (
            <span className="evidence-tag tag-verified">Signature verified</span>
          )}
        </div>
      </div>

      {/* Hashes */}
      <Section title="Cryptographic hashes">
        <HashRow label="MD5" value={hashes?.md5} />
        <HashRow label="SHA-1" value={hashes?.sha1} />
        <HashRow label="SHA-256" value={hashes?.sha256} />

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn" onClick={handleReverify} disabled={reverifying}>
            {reverifying ? 'Re-verifying…' : 'Re-verify integrity now'}
          </button>
          {reverifyResult && (
            <span className={`evidence-tag ${reverifyResult.intact ? 'tag-verified' : 'tag-red'}`}>
              {reverifyResult.intact ? 'Hash matches — integrity intact' : 'HASH MISMATCH — possible tampering'}
            </span>
          )}
        </div>
      </Section>

      {/* File signature */}
      <Section title="File signature analysis">
        <InfoRow label="Declared MIME (by extension)" value={evidence.mime_type_declared} />
        <InfoRow label="Detected MIME (by magic bytes)" value={evidence.mime_type_detected} />
        <InfoRow label="File size" value={formatBytes(evidence.file_size_bytes)} />
      </Section>

      {/* Filesystem metadata */}
      {fsMeta && (
        <Section title="Filesystem metadata (MAC times)">
          <InfoRow label="Created" value={fsMeta.metadata_json.created_at} />
          <InfoRow label="Modified" value={fsMeta.metadata_json.modified_at} />
          <InfoRow label="Accessed" value={fsMeta.metadata_json.accessed_at} />
          <InfoRow label="Changed (inode)" value={fsMeta.metadata_json.changed_at} />
        </Section>
      )}

      {/* EXIF metadata, only present for images that had it */}
      {exifMeta && (
        <Section title="EXIF metadata">
          <pre
            className="mono"
            style={{
              fontSize: 12,
              color: 'var(--color-text-dim)',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 3,
              padding: 12,
              overflowX: 'auto',
            }}
          >
            {JSON.stringify(exifMeta.metadata_json, null, 2)}
          </pre>
        </Section>
      )}

      {/* Chain of custody */}
      <Section title="Chain of custody">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {custodyTrail.map((entry, idx) => (
            <div
              key={entry.log_id}
              style={{
                display: 'flex',
                gap: 14,
                padding: '10px 0',
                borderBottom: idx < custodyTrail.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}
            >
              <div style={{ width: 8, display: 'flex', justifyContent: 'center', paddingTop: 4 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background:
                      entry.action === 'flagged' || entry.action_details?.includes('FAILED')
                        ? 'var(--color-tag-red-bright)'
                        : 'var(--color-verified)',
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="mono" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {entry.action}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--color-text-faint)' }}>
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-text-dim)', marginTop: 2 }}>
                  {entry.action_details}
                  {entry.investigator_name && ` — ${entry.investigator_name}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="card" style={{ padding: 20, marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function HashRow({ label, value }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 12, color: 'var(--color-text-faint)', marginBottom: 4 }}>{label}</div>
      <div className="hash-value">{value || '—'}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
      <span style={{ color: 'var(--color-text-faint)' }}>{label}</span>
      <span className="mono" style={{ color: 'var(--color-text)' }}>{String(value ?? '—')}</span>
    </div>
  );
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}