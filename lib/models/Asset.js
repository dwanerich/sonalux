
import conn from '../db.js';
import mongoose from 'mongoose';

const AssetSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Types.ObjectId, ref: 'Session' },
  type: { type: String, enum: ['loop','one_shot','midi','mix','stem'], index: true },
  url: String,
  tags: [String],
  bpm: Number,
  key: String,
  rsg_id: String
}, { timestamps: true });

export default (conn.models.Asset || conn.model('Asset', AssetSchema));
