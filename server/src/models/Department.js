import mongoose from 'mongoose';

// MongoDB department document: a team name and optional description.
const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true, maxlength: 60 },
  description: { type: String, trim: true, maxlength: 240, default: '' }
}, { timestamps: true });

export default mongoose.model('Department', departmentSchema);
