import mongoose from 'mongoose';

const habitLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    habitAppId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    completed: { type: Boolean, required: true },
  },
  { timestamps: true }
);

habitLogSchema.index({ userId: 1, habitAppId: 1, date: 1 }, { unique: true });
habitLogSchema.index({ userId: 1, date: 1 });
habitLogSchema.index({ habitAppId: 1, date: 1 });

export default mongoose.model('HabitLog', habitLogSchema);
