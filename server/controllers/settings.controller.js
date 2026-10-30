/**
 * Settings Controller — request handling for settings endpoints.
 */

import Settings from '../models/Settings.js';
import { ensureSettings, invalidateUserCache } from '../services/habit.service.js';

/** GET /api/settings */
export const getSettings = async (req, res) => {
  const settings = await ensureSettings(req.user._id);
  res.json({ theme: settings.theme });
};

/** PUT /api/settings */
export const updateSettings = async (req, res) => {
  const theme = req.body?.theme;
  if (!['light', 'dark'].includes(theme)) {
    res
      .status(400)
      .json({ error: 'Validation failed', message: 'Theme must be light or dark.' });
    return;
  }

  invalidateUserCache(req.user._id);
  const settings = await Settings.findOneAndUpdate(
    { userId: req.user._id },
    { theme },
    { new: true, upsert: true, runValidators: true }
  );
  res.json({ theme: settings.theme });
};
