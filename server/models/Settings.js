import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User', unique: true, index: true },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
  },
  { timestamps: true }
);

export default mongoose.model('Settings', settingsSchema);
