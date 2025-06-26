import mongoose from 'mongoose';

const rewardItemSchema = new mongoose.Schema({
  range: {
    type: String, // e.g., "1", "2-3"
    required: true,
  },
  coins: {
    type: Number,
    default: 0,
  },
  points: {
    type: Number,
    default: 0,
  },
});

const rewardsListItemSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  charge: {
    type: Number,
    required: true,
  },
  points: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
});

const prizeSchema = new mongoose.Schema({
  rewards: {
    type: [rewardItemSchema],
    default: [
      { range: '1', coins: 50000, points: 0 },
      { range: '2', coins: 25000, points: 0 },
      { range: '3', coins: 10000, points: 0 },
      { range: '4-10', coins: 0, points: 100 },
      { range: '11-20', coins: 0, points: 50 },
    ],
  },
  levels: {
    type: [rewardsListItemSchema],
    default: [
      { amount: 200, charge: 25, points: 1, name: 'Amateur Grounds' },
      { amount: 500, charge: 25, points: 2, name: 'Royal Ramble' },
      { amount: 1000, charge: 50, points: 5, name: 'Summer Slam' },
      { amount: 2000, charge: 100, points: 10, name: 'Jockers Gambit' },
    ],
  },
});


export default mongoose.model('Prize', prizeSchema);
