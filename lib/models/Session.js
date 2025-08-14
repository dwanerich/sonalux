
import conn from '../db.js';
import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Types.ObjectId, ref: 'User' },
  prompt: String,
  controls: Object,
  rsg_id: String,
  refs_used: [String],
  vocal_pref: String,
  artifacts: Object,
  finalWav: String,
  finalMp3: String,
  reportPath: String,
  sha256: String
}, { timestamps: true });

export default (conn.models.Session || conn.model('Session', SessionSchema));
