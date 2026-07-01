const pool = require('../config/db');

function generateCaseReference() {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `DFIT-${year}-${random}`;
}

async function createCase(req, res) {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });

    const caseReference = generateCaseReference();
    const createdBy = req.investigator ? req.investigator.investigator_id : null;

    const result = await pool.query(
      `INSERT INTO cases (case_reference, title, description, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [caseReference, title, description || null, createdBy]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create case' });
  }
}

async function listCases(req, res) {
  try {
    const result = await pool.query(
      `SELECT c.*, i.full_name AS created_by_name,
              (SELECT COUNT(*) FROM evidence e WHERE e.case_id = c.case_id) AS evidence_count
       FROM cases c
       LEFT JOIN investigators i ON c.created_by = i.investigator_id
       ORDER BY c.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
}

async function getCase(req, res) {
  try {
    const { id } = req.params;
    const caseResult = await pool.query('SELECT * FROM cases WHERE case_id = $1', [id]);
    if (caseResult.rows.length === 0) return res.status(404).json({ error: 'Case not found' });

    const evidenceResult = await pool.query(
      `SELECT evidence_id, original_filename, file_size_bytes, mime_type_declared,
              mime_type_detected, signature_mismatch, uploaded_at
       FROM evidence WHERE case_id = $1 ORDER BY uploaded_at DESC`,
      [id]
    );

    res.json({ ...caseResult.rows[0], evidence: evidenceResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch case' });
  }
}

async function updateCaseStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['open', 'closed', 'archived'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
    }

    const result = await pool.query(
      `UPDATE cases SET status = $1, updated_at = NOW() WHERE case_id = $2 RETURNING *`,
      [status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Case not found' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update case' });
  }
}

module.exports = { createCase, listCases, getCase, updateCaseStatus };
