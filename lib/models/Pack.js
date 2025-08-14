
import conn from '../db.js';
import mongoose from 'mongoose';

const PackSchema = new mongoose.Schema({
  slug: { type: String, unique: true },
  title: String,
  cover: String,
  rsg_id: String,
  items: [{ type: mongoose.Types.ObjectId, ref: 'Asset' }],
  price: { type: Number, default: 0 },
  featured: { type: Boolean, default: false }
}, { timestamps: true });

export default (conn.models.Pack || conn.model('Pack', PackSchema));
