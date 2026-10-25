import mongoose from 'mongoose';

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

export default mongoose.model('Habit', habitSchema);
