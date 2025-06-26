import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
    suit: {
      type: String,
      required: true,
      enum: ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES', 'BLACK', 'RED'],
    },
    type: {
      type: String,
      enum: ['player', 'opponent', 'pile', 'transitioning', 'played'],
    },
  },
  { _id: false } // 👈 prevents automatic _id on card subdocs
);

const pendingDrawSchema = new mongoose.Schema(
  {
    player: {
      type: String,
      required: true,
    },
    count: {
      type: Number,
      required: true,
    },
  },
  { _id: false } // 👈 optional, same if you don't want _id here
);

const gameStateSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  chosenSuit: {
    type: String,
    enum: ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'],
  },
  players: {
    type: Map,
    of: [cardSchema], // 👈 these card arrays won't have _id
    required: true,
  },
  deck: {
    type: [cardSchema], // 👈 same here
    required: true,
  },
  playedCards: {
    type: [cardSchema], // 👈 and here
    required: true,
    default: [],
  },
  cuttingCard: {
    type: cardSchema,
    required: true,
  },
  currentCard: {
    type: cardSchema,
  },
  currentTurn: {
    type: String,
    required: true,
  },
  winner: {
    type: String,
  },
  pendingDraw: {
    type: pendingDrawSchema,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const GameState = mongoose.model('GameState', gameStateSchema);
