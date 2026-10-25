import mongoose from 'mongoose';

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

export default mongoose.model('Analytics', analyticsSchema);
