
import conn from '../db.js';
import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Types.ObjectId, ref: 'User' },
  provider: { type: String, enum: ['stripe','paypal'] },
  kind: { type: String, enum: ['one_time','subscription'] },
  amount: Number,
  currency: { type: String, default: 'usd' },
  extId: String,
  status: String,
  meta: Object
}, { timestamps: true });

export default (conn.models.Payment || conn.model('Payment', PaymentSchema));
