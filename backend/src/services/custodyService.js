const pool = require('../config/db');

/**
 * Records an action in the chain of custody log for a piece of evidence.
 * Every meaningful interaction with evidence (upload, hash, view, download,
 * re-verify) should call this so the case has a complete audit trail.
 *
 * @param {Object} params
 * @param {number} params.evidenceId
 * @param {number|null} params.investigatorId
 * @param {string} params.action - short action code e.g. 'uploaded', 'hashed', 'viewed'
 * @param {string} [params.details]
 * @param {string} [params.ipAddress]
 */
async function logAction({ evidenceId, investigatorId = null, action, details = '', ipAddress = '' }) {
  const query = `
    INSERT INTO custody_log (evidence_id, investigator_id, action, action_details, ip_address)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const values = [evidenceId, investigatorId, action, details, ipAddress];
  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Retrieves the full chain of custody for a piece of evidence, ordered
 * chronologically, joined with investigator names for readability.
 */
async function getCustodyTrail(evidenceId) {
  const query = `
    SELECT cl.log_id, cl.action, cl.action_details, cl.ip_address, cl.timestamp,
           i.full_name AS investigator_name
    FROM custody_log cl
    LEFT JOIN investigators i ON cl.investigator_id = i.investigator_id
    WHERE cl.evidence_id = $1
    ORDER BY cl.timestamp ASC;
  `;
  const result = await pool.query(query, [evidenceId]);
  return result.rows;
}

module.exports = { logAction, getCustodyTrail };
