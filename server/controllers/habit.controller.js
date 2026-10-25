/**
 * Habit Controller — request handling for habit endpoints.
 */

import { getToday } from '../services/dateUtils.js';
import { isValidDate } from '../services/dateUtils.js';
import {
  buildState,
  createHabit,
  updateHabit,
  deleteHabit,
  toggleHabit,
  reorderHabits,
  resetAllData,
} from '../services/habit.service.js';
import { validateHabitInput } from '../validators/habit.validator.js';

/** GET /api/state */
export const getState = async (req, res) => {
  res.json(await buildState(req.user));
};

/** POST /api/habits */
export const create = async (req, res) => {
  const validation = validateHabitInput(req.body);
  if (!validation.valid) {
    res
      .status(400)
      .json({ error: 'Validation failed', message: validation.errors.join(' ') });
    return;
  }

  const appId = await createHabit(req.user._id, validation.data);
  const state = await buildState(req.user);
  res
    .status(201)
    .json({ habit: state.habits.find((h) => h.id === appId), state });
};

/** PUT /api/habits/:id */
export const update = async (req, res) => {
  const validation = validateHabitInput(req.body);
  if (!validation.valid) {
    res
      .status(400)
      .json({ error: 'Validation failed', message: validation.errors.join(' ') });
    return;
  }

  const habit = await updateHabit(req.user._id, req.params.id, validation.data);
  if (!habit) {
    res.status(404).json({ error: 'Not found', message: 'Habit not found.' });
    return;
  }

  const state = await buildState(req.user);
  res.json({ habit: state.habits.find((h) => h.id === req.params.id), state });
};

/** DELETE /api/habits/:id */
export const remove = async (req, res) => {
  const deleted = await deleteHabit(req.user._id, req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Not found', message: 'Habit not found.' });
    return;
  }
  res.json({ state: await buildState(req.user) });
};

/** POST /api/habits/:id/toggle */
export const toggle = async (req, res) => {
  const date = req.body?.date || getToday();
  if (!isValidDate(date)) {
    res
      .status(400)
      .json({ error: 'Validation failed', message: 'Date must be YYYY-MM-DD.' });
    return;
  }

  const habit = await toggleHabit(req.user._id, req.params.id, date);
  if (!habit) {
    res.status(404).json({ error: 'Not found', message: 'Habit not found.' });
    return;
  }

  res.json({ state: await buildState(req.user) });
};

/** PUT /api/habits/reorder */
export const reorder = async (req, res) => {
  const habits = Array.isArray(req.body?.habits) ? req.body.habits : null;
  if (
    !habits ||
    !habits.every(
      (h, index) => typeof h.id === 'string' && Number.isInteger(index)
    )
  ) {
    res
      .status(400)
      .json({
        error: 'Validation failed',
        message: 'Habits must be an ordered array.',
      });
    return;
  }

  await reorderHabits(req.user._id, habits);
  res.json({ state: await buildState(req.user) });
};

/** DELETE /api/data */
export const resetData = async (req, res) => {
  await resetAllData(req.user._id);
  res.json({ state: await buildState(req.user) });
};
