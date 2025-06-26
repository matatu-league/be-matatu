import mongoose from 'mongoose';

const accountCounterSchema = new mongoose.Schema({
  lastAccountId: { type: Number, default: 2000 },
});

export default mongoose.model('AccountCounter', accountCounterSchema);