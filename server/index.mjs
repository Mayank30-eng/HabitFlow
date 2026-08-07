import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import authRoutes from './routes/auth.js';
import { createProtectOrLegacy } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3001);
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'habit_tracker';
const DEFAULT_USER_KEY = process.env.DEFAULT_USER_KEY || 'default-user';

let dbError = MONGODB_URI ? null : 'MONGODB_URI is not configured.';

const habitRecordSchema = {
  date: { type: String, required: true },
  completed: { type: Boolean, required: true },
};

const userSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: 'Habit Tracker User' },
  },
  { timestamps: true }
);

const habitSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    appId: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    type: { type: String, enum: ['good', 'bad'], required: true },
    description: { type: String, default: '' },
    frequency: { type: String, enum: ['daily', 'weekly', 'custom'], default: 'daily' },
    customDays: { type: [Number], default: [] },
    startDate: { type: String, required: true },
    createdAtDate: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);
habitSchema.index({ userId: 1, appId: 1 }, { unique: true });

const habitLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    habitAppId: { type: String, required: true, index: true },
    ...habitRecordSchema,
  },
  { timestamps: true }
);
habitLogSchema.index({ userId: 1, habitAppId: 1, date: 1 }, { unique: true });

const streakSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    habitAppId: { type: String, required: true },
    habitType: { type: String, enum: ['good', 'bad'], required: true },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    avoidanceStreak: { type: Number, default: 0 },
    longestAvoidanceStreak: { type: Number, default: 0 },
  },
  { timestamps: true }
);
streakSchema.index({ userId: 1, habitAppId: 1 }, { unique: true });

const analyticsSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    key: { type: String, required: true, unique: true },
    scope: { type: String, enum: ['overall', 'habit'], required: true },
    habitAppId: { type: String, default: null },
    metrics: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

const settingsSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User', unique: true, index: true },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
const HabitModel = mongoose.model('Habit', habitSchema);
const HabitLog = mongoose.model('HabitLog', habitLogSchema);
const Streak = mongoose.model('Streak', streakSchema);
const Analytics = mongoose.model('Analytics', analyticsSchema);
const Settings = mongoose.model('Settings', settingsSchema);

const app = express();
app.use(express.json({ limit: '1mb' }));

const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDate = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const addDays = (dateStr, days) => {
  const date = parseDate(dateStr);
  date.setDate(date.getDate() + days);
  return formatDate(date);
};

const subDays = (dateStr, days) => addDays(dateStr, -days);
const getToday = () => formatDate(new Date());

const getDaysInRange = (start, end) => {
  const days = [];
  let current = start;
  while (current <= end) {
    days.push(current);
    current = addDays(current, 1);
  }
  return days;
};

const isValidDate = (date) => {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  return formatDate(parseDate(date)) === date;
};

const isDbReady = () => mongoose.connection.readyState === 1;

const requireDb = (req, res, next) => {
  if (!isDbReady()) {
    res.status(503).json({
      error: 'Database unavailable',
      message: dbError || 'MongoDB is not connected yet.',
    });
    return;
  }
  next();
};

const getUserKey = (req) => {
  const headerKey = req.get('x-user-id');
  const queryKey = typeof req.query.userId === 'string' ? req.query.userId : null;
  return (headerKey || queryKey || DEFAULT_USER_KEY).trim() || DEFAULT_USER_KEY;
};

const getUser = async (req) => {
  const key = getUserKey(req);
  return User.findOneAndUpdate(
    { key },
    { $setOnInsert: { key, name: 'Habit Tracker User' } },
    { new: true, upsert: true }
  );
};

// Dual-auth middleware: JWT preferred, legacy X-User-Id fallback
const protectOrLegacy = createProtectOrLegacy(getUser);

const ensureSettings = async (userId) => {
  return Settings.findOneAndUpdate(
    { userId },
    { $setOnInsert: { theme: 'light' } },
    { new: true, upsert: true }
  );
};

const generateId = () => crypto.randomBytes(12).toString('hex');

const sanitizeString = (value) => (typeof value === 'string' ? value.trim() : '');

const validateHabitInput = (data, { partial = false } = {}) => {
  const errors = [];
  const output = {};

  const requireField = (field) => !partial || Object.prototype.hasOwnProperty.call(data, field);

  if (requireField('name')) {
    const name = sanitizeString(data.name);
    if (!name) errors.push('Name is required.');
    output.name = name;
  }

  if (requireField('category')) {
    const category = sanitizeString(data.category);
    if (!category) errors.push('Category is required.');
    output.category = category;
  }

  if (requireField('type')) {
    if (!['good', 'bad'].includes(data.type)) errors.push('Type must be good or bad.');
    output.type = data.type;
  }

  if (requireField('description')) {
    output.description = sanitizeString(data.description);
  }

  if (requireField('frequency')) {
    if (!['daily', 'weekly', 'custom'].includes(data.frequency)) errors.push('Frequency is invalid.');
    output.frequency = data.frequency;
  }

  if (requireField('customDays')) {
    const customDays = Array.isArray(data.customDays) ? data.customDays : [];
    if (!customDays.every((day) => Number.isInteger(day) && day >= 0 && day <= 6)) {
      errors.push('Custom days must be weekday numbers from 0 to 6.');
    }
    output.customDays = [...new Set(customDays)];
  }

  if (requireField('startDate')) {
    if (!isValidDate(data.startDate)) errors.push('Start date must be YYYY-MM-DD.');
    output.startDate = data.startDate;
  }

  return { valid: errors.length === 0, errors, data: output };
};

const habitToClient = (habit, logs) => ({
  id: habit.appId,
  name: habit.name,
  category: habit.category,
  type: habit.type,
  description: habit.description || '',
  frequency: habit.frequency,
  customDays: habit.customDays || [],
  startDate: habit.startDate,
  createdAt: habit.createdAtDate,
  history: logs
    .filter((log) => log.habitAppId === habit.appId)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((log) => ({ date: log.date, completed: log.completed })),
  order: habit.order,
});

const isHabitSuccessOnDate = (habit, date) => {
  if (date < habit.startDate) return false;
  const record = habit.history.find((log) => log.date === date);
  return habit.type === 'good' ? Boolean(record?.completed) : !record?.completed;
};

const isBadHabitOccurrenceOnDate = (habit, date) => {
  if (habit.type !== 'bad' || date < habit.startDate) return false;
  return Boolean(habit.history.find((log) => log.date === date)?.completed);
};

const getHabitActiveDates = (habit, start, end) => {
  const activeStart = start > habit.startDate ? start : habit.startDate;
  if (activeStart > end) return [];
  return getDaysInRange(activeStart, end);
};

const calculateStreak = (habit) => {
  const today = getToday();
  if (habit.startDate > today) return 0;
  let streak = 0;
  let current = today;

  while (current >= habit.startDate) {
    const record = habit.history.find((log) => log.date === current);
    const success = isHabitSuccessOnDate(habit, current);

    if (success) {
      if (habit.type === 'good' && current === today && !record) {
        current = subDays(current, 1);
        continue;
      }
      streak += 1;
      current = subDays(current, 1);
    } else if (habit.type === 'good' && current === today && !record) {
      current = subDays(current, 1);
    } else {
      break;
    }
  }

  return streak;
};

const calculateLongestStreak = (habit) => {
  const range = getHabitActiveDates(habit, habit.startDate, getToday());
  let maxStreak = 0;
  let currentStreak = 0;

  for (const date of range) {
    if (isHabitSuccessOnDate(habit, date)) {
      currentStreak += 1;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return maxStreak;
};

const calculateSuccessRate = (habit, days = 30) => {
  const today = getToday();
  const range = getHabitActiveDates(habit, subDays(today, days - 1), today);
  if (range.length === 0) return 0;
  const successes = range.filter((date) => isHabitSuccessOnDate(habit, date)).length;
  return Math.round((successes / range.length) * 100);
};

const calculateTotalSuccesses = (habit) => {
  return getHabitActiveDates(habit, habit.startDate, getToday()).filter((date) => isHabitSuccessOnDate(habit, date)).length;
};

const calculateTimesPerformed = (habit) => {
  if (habit.type === 'good') return 0;
  const today = getToday();
  return habit.history.filter((log) => log.completed && log.date >= habit.startDate && log.date <= today).length;
};

const calculateRelapseCount = (habit) => {
  if (habit.type === 'good') return 0;
  let relapses = 0;
  let wasAvoiding = true;

  for (const date of getHabitActiveDates(habit, habit.startDate, getToday())) {
    const performed = isBadHabitOccurrenceOnDate(habit, date);
    if (performed && wasAvoiding) {
      relapses += 1;
      wasAvoiding = false;
    } else if (!performed) {
      wasAvoiding = true;
    }
  }

  return relapses;
};

const calculateOccurrencesInPeriod = (habit, days) => {
  if (habit.type === 'good') return 0;
  const today = getToday();
  return getHabitActiveDates(habit, subDays(today, days - 1), today).filter((date) => isBadHabitOccurrenceOnDate(habit, date)).length;
};

const calculateBadHabitPenaltyImpact = (habit, days = 30) => {
  if (habit.type === 'good') return 0;
  const today = getToday();
  const range = getHabitActiveDates(habit, subDays(today, days - 1), today);
  if (range.length === 0) return 0;
  const occurrences = range.filter((date) => isBadHabitOccurrenceOnDate(habit, date)).length;
  return Math.round((occurrences / range.length) * 100);
};

const deriveOverallAnalytics = (habits) => {
  const today = getToday();
  let totalPossible = 0;
  let totalSuccesses = 0;

  for (const habit of habits) {
    const range = getHabitActiveDates(habit, habit.startDate, today);
    totalPossible += range.length;
    totalSuccesses += range.filter((date) => isHabitSuccessOnDate(habit, date)).length;
  }

  const goodHabits = habits.filter((habit) => habit.type === 'good');
  const badHabits = habits.filter((habit) => habit.type === 'bad');
  const goodActiveToday = goodHabits.filter((habit) => habit.startDate <= today);
  const badActiveToday = badHabits.filter((habit) => habit.startDate <= today);
  const badPerformedToday = badActiveToday.filter((habit) => isBadHabitOccurrenceOnDate(habit, today)).length;

  return {
    successRate: totalPossible === 0 ? 0 : Math.round((totalSuccesses / totalPossible) * 100),
    totalHabits: habits.length,
    good: {
      total: goodHabits.length,
      completedToday: goodActiveToday.filter((habit) => Boolean(habit.history.find((log) => log.date === today)?.completed)).length,
      completionRate: goodHabits.length === 0 ? 0 : Math.round(goodHabits.reduce((sum, habit) => sum + calculateSuccessRate(habit), 0) / goodHabits.length),
      currentStreak: goodHabits.length === 0 ? 0 : Math.max(...goodHabits.map(calculateStreak)),
      longestStreak: goodHabits.length === 0 ? 0 : Math.max(...goodHabits.map(calculateLongestStreak)),
    },
    bad: {
      total: badHabits.length,
      avoidedToday: badActiveToday.length - badPerformedToday,
      performedToday: badPerformedToday,
      avoidanceRate: badHabits.length === 0 ? 0 : Math.round(badHabits.reduce((sum, habit) => sum + calculateSuccessRate(habit), 0) / badHabits.length),
      bestAvoidanceStreak: badHabits.length === 0 ? 0 : Math.max(...badHabits.map(calculateStreak)),
      longestAvoidanceStreak: badHabits.length === 0 ? 0 : Math.max(...badHabits.map(calculateLongestStreak)),
      totalRelapses: badHabits.reduce((sum, habit) => sum + calculateRelapseCount(habit), 0),
      totalOccurrences: badHabits.reduce((sum, habit) => sum + calculateTimesPerformed(habit), 0),
      totalAvoidedDays: badHabits.reduce((sum, habit) => sum + calculateTotalSuccesses(habit), 0),
      occurrencesThisWeek: badHabits.reduce((sum, habit) => sum + calculateOccurrencesInPeriod(habit, 7), 0),
      occurrencesThisMonth: badHabits.reduce((sum, habit) => sum + calculateOccurrencesInPeriod(habit, 30), 0),
      penaltyImpact: badHabits.length === 0 ? 0 : Math.round(badHabits.reduce((sum, habit) => sum + calculateBadHabitPenaltyImpact(habit), 0) / badHabits.length),
    },
  };
};

const getClientHabits = async (userId) => {
  const habits = await HabitModel.find({ userId }).sort({ order: 1, createdAt: 1 }).lean();
  const habitIds = habits.map((habit) => habit.appId);
  const logs = habitIds.length > 0
    ? await HabitLog.find({ userId, habitAppId: { $in: habitIds } }).sort({ date: 1 }).lean()
    : [];
  return habits.map((habit) => habitToClient(habit, logs));
};

const persistDerivedData = async (userId, habits) => {
  const analytics = deriveOverallAnalytics(habits);

  await Analytics.findOneAndUpdate(
    { userId, key: `${userId}:overall` },
    { userId, key: `${userId}:overall`, scope: 'overall', habitAppId: null, metrics: analytics },
    { upsert: true, new: true }
  );

  const activeHabitIds = habits.map((habit) => habit.id);
  await Promise.all(habits.map(async (habit) => {
    const current = calculateStreak(habit);
    const longest = calculateLongestStreak(habit);
    const metrics = {
      successRate: calculateSuccessRate(habit),
      totalSuccesses: calculateTotalSuccesses(habit),
      occurrences: calculateTimesPerformed(habit),
      relapseCount: calculateRelapseCount(habit),
      penaltyImpact: calculateBadHabitPenaltyImpact(habit),
      currentStreak: habit.type === 'good' ? current : 0,
      longestStreak: habit.type === 'good' ? longest : 0,
      avoidanceStreak: habit.type === 'bad' ? current : 0,
      longestAvoidanceStreak: habit.type === 'bad' ? longest : 0,
    };

    await Streak.findOneAndUpdate(
      { userId, habitAppId: habit.id },
      {
        userId,
        habitAppId: habit.id,
        habitType: habit.type,
        currentStreak: metrics.currentStreak,
        longestStreak: metrics.longestStreak,
        avoidanceStreak: metrics.avoidanceStreak,
        longestAvoidanceStreak: metrics.longestAvoidanceStreak,
      },
      { upsert: true, new: true }
    );

    await Analytics.findOneAndUpdate(
      { userId, key: `${userId}:habit:${habit.id}` },
      { userId, key: `${userId}:habit:${habit.id}`, scope: 'habit', habitAppId: habit.id, metrics },
      { upsert: true, new: true }
    );
  }));

  await Streak.deleteMany({ userId, habitAppId: { $nin: activeHabitIds } });
  await Analytics.deleteMany({ userId, scope: 'habit', habitAppId: { $nin: activeHabitIds } });

  return analytics;
};

const buildState = async (user) => {
  const settings = await ensureSettings(user._id);
  const habits = await getClientHabits(user._id);
  const analytics = await persistDerivedData(user._id, habits);
  return {
    user: { id: String(user._id), key: user.key, name: user.name },
    habits,
    settings: { theme: settings.theme },
    analytics,
  };
};

const upsertImportedHabit = async (userId, habit, importOrder) => {
  const validation = validateHabitInput(habit);
  if (!validation.valid) {
    throw new Error(`Invalid habit "${habit?.name || habit?.id || 'unknown'}": ${validation.errors.join(' ')}`);
  }

  const appId = sanitizeString(habit.id) || generateId();
  const createdAtDate = isValidDate(habit.createdAt) ? habit.createdAt : getToday();
  const order = Number.isFinite(habit.order) ? habit.order : importOrder;

  await HabitModel.findOneAndUpdate(
    { userId, appId },
    {
      userId,
      appId,
      ...validation.data,
      createdAtDate,
      order,
    },
    { upsert: true, new: true, runValidators: true }
  );

  if (Array.isArray(habit.history)) {
    await Promise.all(habit.history.map(async (record) => {
      if (!isValidDate(record.date) || typeof record.completed !== 'boolean') return;
      if (validation.data.type === 'bad' && !record.completed) return;

      await HabitLog.findOneAndUpdate(
        { userId, habitAppId: appId, date: record.date },
        { userId, habitAppId: appId, date: record.date, completed: record.completed },
        { upsert: true, new: true, runValidators: true }
      );
    }));
  }
};

app.get('/api/health', (req, res) => {
  res.json({
    ok: isDbReady(),
    database: isDbReady() ? 'connected' : 'unavailable',
    message: isDbReady() ? 'MongoDB connected.' : dbError || 'MongoDB is not connected yet.',
  });
});

// JWT_SECRET startup warning
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: JWT_SECRET is not set. Auth endpoints will not work.');
}

// Auth routes (require DB)
app.use('/api/auth', requireDb, authRoutes);

app.use('/api', requireDb, protectOrLegacy);

app.get('/api/state', asyncHandler(async (req, res) => {
  const user = req.user;
  res.json(await buildState(user));
}));

app.get('/api/settings', asyncHandler(async (req, res) => {
  const user = req.user;
  const settings = await ensureSettings(user._id);
  res.json({ theme: settings.theme });
}));

app.put('/api/settings', asyncHandler(async (req, res) => {
  const user = req.user;
  const theme = req.body?.theme;
  if (!['light', 'dark'].includes(theme)) {
    res.status(400).json({ error: 'Validation failed', message: 'Theme must be light or dark.' });
    return;
  }
  const settings = await Settings.findOneAndUpdate({ userId: user._id }, { theme }, { new: true, upsert: true, runValidators: true });
  res.json({ theme: settings.theme });
}));

app.post('/api/habits', asyncHandler(async (req, res) => {
  const user = req.user;
  const validation = validateHabitInput(req.body);
  if (!validation.valid) {
    res.status(400).json({ error: 'Validation failed', message: validation.errors.join(' ') });
    return;
  }

  const count = await HabitModel.countDocuments({ userId: user._id });
  const habit = await HabitModel.create({
    userId: user._id,
    appId: generateId(),
    ...validation.data,
    createdAtDate: getToday(),
    order: count,
  });

  const state = await buildState(user);
  res.status(201).json({ habit: state.habits.find((item) => item.id === habit.appId), state });
}));

app.put('/api/habits/:id', asyncHandler(async (req, res) => {
  const user = req.user;
  const validation = validateHabitInput(req.body);
  if (!validation.valid) {
    res.status(400).json({ error: 'Validation failed', message: validation.errors.join(' ') });
    return;
  }

  const habit = await HabitModel.findOneAndUpdate(
    { userId: user._id, appId: req.params.id },
    { ...validation.data },
    { new: true, runValidators: true }
  );
  if (!habit) {
    res.status(404).json({ error: 'Not found', message: 'Habit not found.' });
    return;
  }

  if (validation.data.type === 'bad') {
    await HabitLog.deleteMany({ userId: user._id, habitAppId: req.params.id, completed: false });
  }

  const state = await buildState(user);
  res.json({ habit: state.habits.find((item) => item.id === req.params.id), state });
}));

app.delete('/api/habits/:id', asyncHandler(async (req, res) => {
  const user = req.user;
  const deleted = await HabitModel.findOneAndDelete({ userId: user._id, appId: req.params.id });
  if (!deleted) {
    res.status(404).json({ error: 'Not found', message: 'Habit not found.' });
    return;
  }
  await HabitLog.deleteMany({ userId: user._id, habitAppId: req.params.id });
  await Streak.deleteMany({ userId: user._id, habitAppId: req.params.id });
  await Analytics.deleteMany({ userId: user._id, scope: 'habit', habitAppId: req.params.id });
  res.json({ state: await buildState(user) });
}));

app.post('/api/habits/:id/toggle', asyncHandler(async (req, res) => {
  const user = req.user;
  const date = req.body?.date || getToday();
  if (!isValidDate(date)) {
    res.status(400).json({ error: 'Validation failed', message: 'Date must be YYYY-MM-DD.' });
    return;
  }

  const habit = await HabitModel.findOne({ userId: user._id, appId: req.params.id });
  if (!habit) {
    res.status(404).json({ error: 'Not found', message: 'Habit not found.' });
    return;
  }

  const existing = await HabitLog.findOne({ userId: user._id, habitAppId: req.params.id, date });
  if (existing) {
    if (habit.type === 'bad' && existing.completed) {
      await HabitLog.deleteOne({ _id: existing._id });
    } else {
      existing.completed = !existing.completed;
      if (habit.type === 'bad' && !existing.completed) {
        await HabitLog.deleteOne({ _id: existing._id });
      } else {
        await existing.save();
      }
    }
  } else {
    await HabitLog.create({ userId: user._id, habitAppId: req.params.id, date, completed: true });
  }

  res.json({ state: await buildState(user) });
}));

app.put('/api/habits/reorder', asyncHandler(async (req, res) => {
  const user = req.user;
  const habits = Array.isArray(req.body?.habits) ? req.body.habits : null;
  if (!habits || !habits.every((habit, index) => typeof habit.id === 'string' && Number.isInteger(index))) {
    res.status(400).json({ error: 'Validation failed', message: 'Habits must be an ordered array.' });
    return;
  }

  await Promise.all(habits.map((habit, order) => HabitModel.updateOne({ userId: user._id, appId: habit.id }, { order })));
  res.json({ state: await buildState(user) });
}));

app.post('/api/import', asyncHandler(async (req, res) => {
  const user = req.user;
  const habits = Array.isArray(req.body?.habits) ? req.body.habits : null;
  if (!habits) {
    res.status(400).json({ error: 'Validation failed', message: 'Import payload must contain a habits array.' });
    return;
  }

  if (req.body?.replace === true) {
    await HabitModel.deleteMany({ userId: user._id });
    await HabitLog.deleteMany({ userId: user._id });
    await Streak.deleteMany({ userId: user._id });
    await Analytics.deleteMany({ userId: user._id });
  }

  for (let index = 0; index < habits.length; index += 1) {
    await upsertImportedHabit(user._id, habits[index], index);
  }

  res.json({ state: await buildState(user) });
}));

app.delete('/api/data', asyncHandler(async (req, res) => {
  const user = req.user;
  await HabitModel.deleteMany({ userId: user._id });
  await HabitLog.deleteMany({ userId: user._id });
  await Streak.deleteMany({ userId: user._id });
  await Analytics.deleteMany({ userId: user._id });
  res.json({ state: await buildState(user) });
}));

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

const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB })
    .then(() => {
      dbError = null;
      console.log(`MongoDB connected: ${MONGODB_DB}`);
    })
    .catch((error) => {
      dbError = error.message;
      console.error('MongoDB connection failed:', error.message);
    });
}

mongoose.connection.on('disconnected', () => {
  if (MONGODB_URI) dbError = 'MongoDB disconnected.';
});

mongoose.connection.on('connected', () => {
  dbError = null;
});

app.listen(PORT, () => {
  console.log(`Habit Tracker API listening on http://127.0.0.1:${PORT}`);
});
