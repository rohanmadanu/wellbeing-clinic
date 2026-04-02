import mongoose from 'mongoose';

const chunkSchema = new mongoose.Schema({
  text:      { type: String, required: true },
  embedding: { type: [Number], required: true }, // Mistral embedding vector
  pageNum:   { type: Number, default: 1 },
});

const caseSheetSchema = new mongoose.Schema({
  patient:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileName:     { type: String, required: true },
  fileType:     { type: String }, // image/jpeg, application/pdf etc
  extractedText:{ type: String }, // full OCR text
  chunks:       [chunkSchema],    // embedded chunks for RAG
  uploadedAt:   { type: Date, default: Date.now },
  uploadedBy:   { type: String, enum: ['patient', 'doctor'], default: 'patient' },
  notes:        { type: String }, // optional doctor notes
});

export default mongoose.model('CaseSheet', caseSheetSchema);