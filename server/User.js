import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:  { type: String, required: true },
  role:      { type: String, enum: ['patient', 'doctor'], default: 'patient' },
  phone:     { type: String },
  patientId: { type: String, unique: true, sparse: true }, // e.g. WB-2026-00042
  // Google OAuth tokens (doctors only)
  googleAccessToken:  { type: String },
  googleRefreshToken: { type: String },
  googleConnected:    { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('User', userSchema);