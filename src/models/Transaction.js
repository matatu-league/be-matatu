import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  userUID: { type: String }, // Could be user ID or account number
  msisdn: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'UGX' },
  provider: { type: String },
  charge: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['PENDING', 'SUCCESS', 'FAILED'], 
    default: 'PENDING' 
  },
  type: { 
    type: String, 
    enum: ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER'], 
    required: true 
  },
  description: { type: String },
  user: { type: String }
}, { timestamps: true });


export default mongoose.model('Transaction', transactionSchema);