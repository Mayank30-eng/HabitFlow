import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Import all models so Mongoose registers them before any route/service runs
import './models/User.js';
import './models/Habit.js';
import './models/HabitLog.js';
import './models/Streak.js';
import './models/Analytics.js';
import './models/Settings.js';

import { connectDb, requireDb, isDbReady, getDbError } from './config/db.js';
import { protect } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import habitRoutes from './routes/habits.js';
import settingsRoutes from './routes/settings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3001);

// ─── Express Setup ──────────────────────────────────────────────────────────

const app = express();
app.disable('x-powered-by');

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(express.json({ limit: '1mb' }));

// ─── Health ─────────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({
    ok: isDbReady(),
    database: isDbReady() ? 'connected' : 'unavailable',
    message: isDbReady() ? 'MongoDB connected.' : getDbError() || 'MongoDB is not connected yet.',
  });
});

// ─── JWT_SECRET Warning ─────────────────────────────────────────────────────

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: JWT_SECRET is not set. Auth endpoints will not work.');
}

// ─── Routes ─────────────────────────────────────────────────────────────────

// Auth routes (require DB, no JWT)
app.use('/api/auth', requireDb, authRoutes);

// All subsequent /api routes require DB + auth
app.use('/api', requireDb, protect);

// Habit + state routes
app.use('/api', habitRoutes);

// Settings routes
app.use('/api/settings', settingsRoutes);

// ─── Error Handler ──────────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) {
    next(err);
    return;
  }
  res.status(500).json({
    error: 'Server error',
    message: err.message || 'Something went wrong while saving your data.',
  });
});

// ─── Static Frontend ────────────────────────────────────────────────────────

const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ─── Start ──────────────────────────────────────────────────────────────────

await connectDb();

app.listen(PORT, () => {
  console.log(`Habit Tracker API listening on http://127.0.0.1:${PORT}`);
});
