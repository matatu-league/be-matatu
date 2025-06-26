// models/BattleSession.ts
import mongoose from 'mongoose';

const BattleSessionSchema = new mongoose.Schema({
  requestId: { type: String, required: true, unique: true },
  players: { type: [String], required: true }, // [uid1, uid2]
  gameIds: { type: [String], default: [] },
  currentRound: { type: Number, default: 1 },
  bestOf: { type: Number, required: true, default: 11 },
  wins: { type: Map, of: Number, default: {} },
  stake: { type: Number, required: true },
  status: {
    type: String,
    enum: ['PENDING', 'ONGOING', 'COMPLETED'],
    default: 'PENDING',
  },
  winner: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

const BattleSession = mongoose.model('BattleSession', BattleSessionSchema);
export default BattleSession;
