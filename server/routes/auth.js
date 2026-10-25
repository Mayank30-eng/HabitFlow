import { Router } from 'express';
import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';
import { protect } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimiter.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
});

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};

    // Manual validation (matches existing server's inline pattern)
    const errors = [];
    if (!name || typeof name !== 'string' || !name.trim()) {
      errors.push('Name is required');
    } else if (name.trim().length > 100) {
      errors.push('Name is too long');
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      errors.push('A valid email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.push('A valid email is required');
    }

    if (!password || typeof password !== 'string') {
      errors.push('Password is required');
    } else if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: errors[0], errors });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
    });

    const token = signToken(user._id);
    res.status(201).json({ token, user });
  } catch (err) {
    // Mongoose duplicate key error (race condition fallback)
    if (err.code === 11000) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ message: 'A valid email is required' });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ message: 'Password is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user._id);
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/logout
// JWTs are stateless; the client discards the token. The endpoint exists so
// logout is an authenticated, auditable server round-trip.
router.post('/logout', protect, (req, res) => {
  res.json({ message: 'Logged out' });
});

export default router;
