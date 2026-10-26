import mongoose from 'mongoose';

// MongoDB leave document: employee, dates, reason, and approval status.
const leaveRequestSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  type: { type: String, enum: ['Annual leave', 'Sick leave', 'Personal leave', 'Unpaid leave'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, trim: true, maxlength: 500, default: '' },
  status: { type: String, enum: ['Pending', 'Approved', 'Declined'], default: 'Pending' }
}, { timestamps: true });

export default mongoose.model('LeaveRequest', leaveRequestSchema);
