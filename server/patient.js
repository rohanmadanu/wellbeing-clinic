import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    age: Number,
    gender: String,
    category: { 
        type: String, 
        enum: ['Wellness', 'Chronic', 'General'], 
        default: 'General' 
    },
    history: [String],
    reports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Report' }],
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Patient', patientSchema);
