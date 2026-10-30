/**
 * Habit Routes — defines HTTP method + URL + controller mappings.
 */

import { Router } from 'express';
import * as habitCtrl from '../controllers/habit.controller.js';

const router = Router();

const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

// GET /api/state — full app state
router.get('/state', asyncHandler(habitCtrl.getState));

// POST /api/habits — create habit
router.post('/habits', asyncHandler(habitCtrl.create));

// PUT /api/habits/reorder — reorder habits (must be before :id route)
router.put('/habits/reorder', asyncHandler(habitCtrl.reorder));

// PUT /api/habits/:id — update habit
router.put('/habits/:id', asyncHandler(habitCtrl.update));

// DELETE /api/habits/:id — delete habit
router.delete('/habits/:id', asyncHandler(habitCtrl.remove));

// POST /api/habits/:id/toggle — toggle completion
router.post('/habits/:id/toggle', asyncHandler(habitCtrl.toggle));

// POST /api/import — import habits
router.post('/import', asyncHandler(habitCtrl.importData));

// DELETE /api/data — reset all user data
router.delete('/data', asyncHandler(habitCtrl.resetData));

export default router;
