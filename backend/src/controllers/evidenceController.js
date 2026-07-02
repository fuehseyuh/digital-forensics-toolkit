const path = require('path');
const pool = require('../config/db');
const { computeHashes, verifyIntegrity } = require('../services/hashService');
const {
  detectFileSignature,
  extractFilesystemMetadata,
  extractExifMetadata,
} = require('../services/metadataService');
const { logAction, getCustodyTrail } = require('../services/custodyService');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

/**
 * Handles evidence upload: saves the file, computes hashes, extracts
 * metadata, detects signature mismatches, and logs every step to the
 * chain of custody.
 */
async function uploadEvidence(req, res) {
  const client = await pool.connect();
  try {
    const { caseId } = req.params;
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const investigatorId = req.investigator ? req.investigator.investigator_id : null;
    const filePath = path.join(UPLOAD_DIR, req.file.filename);

    // 1. Signature / mismatch detection
    const signature = await detectFileSignature(filePath, req.file.originalname);

    await client.query('BEGIN');

    // 2. Insert evidence record
    const evidenceResult = await client.query(
      `INSERT INTO evidence
        (case_id, original_filename, stored_filename, file_size_bytes,
         mime_type_declared, mime_type_detected, signature_mismatch, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        caseId,
        req.file.originalname,
        req.file.filename,
        req.file.size,
        signature.declaredMime,
        signature.detectedMime,
        signature.mismatch,
        investigatorId,
      ]
    );
    const evidence = evidenceResult.rows[0];

    // 3. Compute hashes
    const hashes = await computeHashes(filePath);
    await client.query(
      `INSERT INTO evidence_hashes (evidence_id, md5, sha1, sha256)
       VALUES ($1, $2, $3, $4)`,
      [evidence.evidence_id, hashes.md5, hashes.sha1, hashes.sha256]
    );

    // 4. Extract filesystem metadata (server-side ingestion timestamps),
    // plus the client-reported original last-modified time — the real
    // last-modified value from the source device's filesystem, sent by
    // the browser's File API before the file ever reached our server.
    // This is more forensically meaningful than the server's own stat()
    // times, which only reflect when *we* received the copy.
    const fsMeta = extractFilesystemMetadata(filePath);
    if (req.body.originalLastModified) {
      fsMeta.original_last_modified = req.body.originalLastModified;
    }
    await client.query(
      `INSERT INTO evidence_metadata (evidence_id, metadata_type, metadata_json)
       VALUES ($1, 'filesystem', $2)`,
      [evidence.evidence_id, fsMeta]
    );

    // 5. Extract EXIF metadata (only meaningful for images, returns null otherwise)
    const exifMeta = await extractExifMetadata(filePath);
    if (exifMeta) {
      await client.query(
        `INSERT INTO evidence_metadata (evidence_id, metadata_type, metadata_json)
         VALUES ($1, 'exif', $2)`,
        [evidence.evidence_id, exifMeta]
      );
    }

    await client.query('COMMIT');

    // 6. Chain of custody logging (outside the transaction — logging is append-only)
    await logAction({
      evidenceId: evidence.evidence_id,
      investigatorId,
      action: 'uploaded',
      details: `Evidence uploaded: ${req.file.originalname}`,
      ipAddress: req.ip,
    });
    await logAction({
      evidenceId: evidence.evidence_id,
      investigatorId,
      action: 'hashed',
      details: `SHA-256: ${hashes.sha256}`,
      ipAddress: req.ip,
    });
    if (signature.mismatch) {
      await logAction({
        evidenceId: evidence.evidence_id,
        investigatorId,
        action: 'flagged',
        details: `Signature mismatch: declared ${signature.declaredMime}, detected ${signature.detectedMime}`,
        ipAddress: req.ip,
      });
    }

    res.status(201).json({
      evidence,
      hashes,
      signature,
      metadata: { filesystem: fsMeta, exif: exifMeta },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to process evidence upload' });
  } finally {
    client.release();
  }
}

/**
 * Returns full evidence detail: hashes, metadata, and chain of custody trail.
 */
async function getEvidenceDetail(req, res) {
  try {
    const { evidenceId } = req.params;

    const evidenceResult = await pool.query('SELECT * FROM evidence WHERE evidence_id = $1', [evidenceId]);
    if (evidenceResult.rows.length === 0) return res.status(404).json({ error: 'Evidence not found' });

    const hashResult = await pool.query('SELECT * FROM evidence_hashes WHERE evidence_id = $1', [evidenceId]);
    const metadataResult = await pool.query('SELECT * FROM evidence_metadata WHERE evidence_id = $1', [evidenceId]);
    const custodyTrail = await getCustodyTrail(evidenceId);

    const investigatorId = req.investigator ? req.investigator.investigator_id : null;
    await logAction({
      evidenceId,
      investigatorId,
      action: 'viewed',
      details: 'Evidence detail viewed',
      ipAddress: req.ip,
    });

    res.json({
      evidence: evidenceResult.rows[0],
      hashes: hashResult.rows[0] || null,
      metadata: metadataResult.rows,
      custodyTrail,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch evidence detail' });
  }
}

/**
 * Re-computes the SHA-256 of the stored file and compares it against the
 * originally recorded hash to confirm the evidence hasn't been tampered with.
 */
async function reverifyIntegrity(req, res) {
  try {
    const { evidenceId } = req.params;

    const evidenceResult = await pool.query('SELECT * FROM evidence WHERE evidence_id = $1', [evidenceId]);
    if (evidenceResult.rows.length === 0) return res.status(404).json({ error: 'Evidence not found' });
    const evidence = evidenceResult.rows[0];

    const hashResult = await pool.query('SELECT * FROM evidence_hashes WHERE evidence_id = $1', [evidenceId]);
    if (hashResult.rows.length === 0) return res.status(404).json({ error: 'No hash on record for this evidence' });

    const filePath = path.join(UPLOAD_DIR, evidence.stored_filename);
    const intact = await verifyIntegrity(filePath, hashResult.rows[0].sha256);

    const investigatorId = req.investigator ? req.investigator.investigator_id : null;
    await logAction({
      evidenceId,
      investigatorId,
      action: 're-verified',
      details: intact ? 'Integrity check passed — hash matches' : 'INTEGRITY CHECK FAILED — hash mismatch',
      ipAddress: req.ip,
    });

    res.json({ intact, storedSha256: hashResult.rows[0].sha256 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to re-verify integrity' });
  }
}

module.exports = { uploadEvidence, getEvidenceDetail, reverifyIntegrity };