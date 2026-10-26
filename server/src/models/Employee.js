import mongoose from 'mongoose';

// MongoDB employee document: profile and employment fields used by the directory.
const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true },
  department: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true },
  phone: { type: String, trim: true, default: '' },
  location: { type: String, trim: true, default: '' },
  employmentType: { type: String, enum: ['Full-time', 'Part-time', 'Contract', 'Intern'], default: 'Full-time' },
  status: { type: String, enum: ['Active', 'On Leave', 'Inactive'], default: 'Active' },
  startDate: { type: Date, default: Date.now },
  notes: { type: String, trim: true, maxlength: 500, default: '' }
}, { timestamps: true });

export default mongoose.model('Employee', employeeSchema);
