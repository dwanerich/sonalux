
import conn from '../db.js';
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, index: true },
  name: String,
  image: String,
  providers: [{ provider: String, accountId: String }],
  role: { type: String, default: 'user' }
}, { timestamps: true });

export default (conn.models.User || conn.model('User', UserSchema));
