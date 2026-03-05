import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  patient:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date:     { type: String, required: true },
  time:     { type: String, required: true },
  type:     { type: String, required: true },
  mode:     { type: String, enum: ['in-person', 'online'], default: 'in-person' },
  notes:    { type: String },
  status:   { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' },
  meetLink: { type: String }, // Google Meet link for online appointments
  createdAt:{ type: Date, default: Date.now },
});

export default mongoose.model('Appointment', appointmentSchema);