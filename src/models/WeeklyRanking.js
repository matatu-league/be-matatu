import mongoose from 'mongoose';

const weeklyRankingSchema = new mongoose.Schema({
  weekStart: { type: Date, required: true }, // Start of the week
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  points: { type: Number, default: 0 },
  position: { type: Number, default: 0 },
  username: { type: String, required: true }, // Denormalized for performance
  history: [
    {
      weekStart: { type: Date, required: true },
      points: { type: Number, default: 0 },
      position: { type: Number, default: 0 },
    },
  ],
});

// Ensure unique user per week
weeklyRankingSchema.index({ weekStart: 1, userId: 1 }, { unique: true });

export default mongoose.model('WeeklyRanking', weeklyRankingSchema);