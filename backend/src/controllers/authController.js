const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

async function register(req, res) {
  try {
    const { full_name, email, password, role } = req.body;
    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'full_name, email, and password are required' });
    }

    const existing = await pool.query('SELECT investigator_id FROM investigators WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO investigators (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING investigator_id, full_name, email, role, created_at`,
      [full_name, email, passwordHash, role || 'analyst']
    );

    const investigator = result.rows[0];
    const token = jwt.sign(
      { investigator_id: investigator.investigator_id, email: investigator.email, role: investigator.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({ investigator, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to register investigator' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const result = await pool.query('SELECT * FROM investigators WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const investigator = result.rows[0];
    const valid = await bcrypt.compare(password, investigator.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { investigator_id: investigator.investigator_id, email: investigator.email, role: investigator.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      investigator: {
        investigator_id: investigator.investigator_id,
        full_name: investigator.full_name,
        email: investigator.email,
        role: investigator.role,
      },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log in' });
  }
}

module.exports = { register, login };
