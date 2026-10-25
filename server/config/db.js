import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'habit_tracker';

let dbError = MONGODB_URI ? null : 'MONGODB_URI is not configured.';

export const isDbReady = () => mongoose.connection.readyState === 1;

export const getDbError = () => dbError;

/** Express middleware — responds 503 if DB is not connected. */
export const requireDb = (req, res, next) => {
  if (!isDbReady()) {
    res.status(503).json({
      error: 'Database unavailable',
      message: dbError || 'MongoDB is not connected yet.',
    });
    return;
  }
  next();
};

/** Connect to MongoDB. Call once at startup. */
export const connectDb = async () => {
  if (!MONGODB_URI) return;

  mongoose.connection.on('disconnected', () => {
    if (MONGODB_URI) dbError = 'MongoDB disconnected.';
  });

  mongoose.connection.on('connected', () => {
    dbError = null;
  });

  try {
    await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB });
    dbError = null;
    console.log(`MongoDB connected: ${MONGODB_DB}`);
  } catch (error) {
    dbError = error.message;
    console.error('MongoDB connection failed:', error.message);
  }
};
