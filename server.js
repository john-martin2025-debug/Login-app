require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'authportal_secret_key_2026';
const MAX_ATTEMPTS = 5;
const COOLDOWN_MS = 30 * 1000;
const failedAttempts = new Map();

pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP')
  .catch((err) => console.error('Schema check error:', err.message));

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(403).json({ error: 'Session expired. Please sign in again.' });
    req.user = payload;
    next();
  });
}

app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email is already registered' });
    }
    const hashed = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (email, password_hash) VALUES ($1, $2)', [email, hashed]);
    res.status(201).json({ message: 'Account created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error during sign up' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const key = email.toLowerCase();
  const record = failedAttempts.get(key);
  if (record && record.lockUntil && Date.now() < record.lockUntil) {
    const secondsLeft = Math.ceil((record.lockUntil - Date.now()) / 1000);
    return res.status(429).json({ error: `Too many failed attempts. Try again in ${secondsLeft}s.` });
  }

  try {
    const result = await pool.query('SELECT id, email, password_hash, last_login FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    const valid = user ? await bcrypt.compare(password, user.password_hash) : false;

    if (!user || !valid) {
      const count = (record?.count || 0) + 1;
      if (count >= MAX_ATTEMPTS) {
        failedAttempts.set(key, { count: 0, lockUntil: Date.now() + COOLDOWN_MS });
        return res.status(429).json({ error: 'Too many failed attempts. Locked for 30 seconds.' });
      }
      failedAttempts.set(key, { count, lockUntil: null });
      return res.status(401).json({ error: `Invalid email or password (${MAX_ATTEMPTS - count} tries left)` });
    }

    failedAttempts.delete(key);
    const previousLogin = user.last_login;
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '2h' });
    res.json({
      token,
      user: { id: user.id, email: user.email, last_login: previousLogin }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error during sign in' });
  }
});

app.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) return res.status(400).json({ error: 'Email and new password are required' });

  try {
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'No account found with that email' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hashed, email]);
    failedAttempts.delete(email.toLowerCase());
    res.json({ message: 'Password reset successfully. You can now sign in.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error during password reset' });
  }
});

app.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, last_login FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Could not verify session' });
  }
});

app.post('/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Both current and new passwords are required' });
  }

  try {
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashed, req.user.id]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Could not update password' });
  }
});

app.delete('/delete-account', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.user.id]);
    res.json({ message: 'Account permanently deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete account' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
