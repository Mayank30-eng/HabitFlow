import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Protects private routes. Verifies the Bearer token, checks expiry,
 * confirms the user still exists, and attaches the user to req.user.
 */
export const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authenticated: no token provided' });
    }

    const token = header.slice('Bearer '.length).trim();

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Session expired, please log in again' });
      }
      return res.status(401).json({ message: 'Invalid token' });
    }

    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Dual-auth middleware factory for the transition period.
 *
 * - If an Authorization: Bearer <token> header is present → JWT auth (preferred).
 * - Otherwise → fall back to the legacy getUser() function (X-User-Id header).
 *
 * @param {Function} legacyGetUser - The existing getUser(req) function from index.mjs
 *                                   that resolves a user via X-User-Id header.
 * @returns Express middleware
 */
export const createProtectOrLegacy = (legacyGetUser) => async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    // JWT path — preferred
    if (header && header.startsWith('Bearer ')) {
      const token = header.slice('Bearer '.length).trim();

      let payload;
      try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ message: 'Session expired, please log in again' });
        }
        return res.status(401).json({ message: 'Invalid token' });
      }

      const user = await User.findById(payload.id);
      if (!user) {
        return res.status(401).json({ message: 'User no longer exists' });
      }

      req.user = user;
      return next();
    }

    // Legacy path — fallback via X-User-Id header
    const user = await legacyGetUser(req);
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};
