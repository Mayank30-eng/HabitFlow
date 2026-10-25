import mongoose from 'mongoose';

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

export default mongoose.model('Streak', streakSchema);
