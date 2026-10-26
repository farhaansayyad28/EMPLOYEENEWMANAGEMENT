import { Router } from 'express';
import mongoose from 'mongoose';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import Attendance from '../models/Attendance.js';
import Employee from '../models/Employee.js';

const router = Router();
// Website: Time & leave → Attendance; routes read history or save the daily register.
router.use(authenticate);
const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`));
const statuses = new Set(['Present', 'Late', 'Absent', 'Work from home', 'Not marked']);

router.get('/history', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    if (!validDate(from) || !validDate(to) || from > to) return res.status(400).json({ message: 'Provide a valid date range in YYYY-MM-DD format.' });
    const filter = { date: { $gte: from, $lte: to } };
    if (req.user.role === 'Employee') {
      const employee = await Employee.findOne({ email: req.user.email }).select('_id');
      filter.employeeId = employee?._id || null;
    }
    res.json(await Attendance.find(filter).populate('employeeId', 'name department role').sort({ date: -1, updatedAt: -1 }));
  } catch (error) { next(error); }
});

router.get('/', async (req, res, next) => {
  try {
    const date = req.query.date;
    if (!validDate(date)) return res.status(400).json({ message: 'Provide a date in YYYY-MM-DD format.' });
    const filter = { date };
    if (req.user.role === 'Employee') {
      const employee = await Employee.findOne({ email: req.user.email }).select('_id');
      filter.employeeId = employee?._id || null;
    }
    res.json(await Attendance.find(filter).sort({ updatedAt: -1 }));
  } catch (error) { next(error); }
});

router.put('/day', authorize('Admin', 'Manager'), async (req, res, next) => {
  try {
    const { date, records } = req.body;
    if (!validDate(date) || !Array.isArray(records)) return res.status(400).json({ message: 'A valid date and attendance records are required.' });
    const employeeIds = [...new Set(records.map((record) => record.employeeId))];
    if (employeeIds.some((id) => !mongoose.isValidObjectId(id))) return res.status(400).json({ message: 'An employee ID is invalid.' });
    if (employeeIds.length && await Employee.countDocuments({ _id: { $in: employeeIds } }) !== employeeIds.length) return res.status(404).json({ message: 'One or more employees no longer exist.' });
    const operations = [];
    for (const record of records) {
      if (!statuses.has(record.status)) return res.status(400).json({ message: 'An attendance status is invalid.' });
      if (record.status === 'Not marked') operations.push({ deleteOne: { filter: { employeeId: record.employeeId, date } } });
      else operations.push({ updateOne: { filter: { employeeId: record.employeeId, date }, update: { $set: { status: record.status, note: String(record.note || '').slice(0, 200) } }, upsert: true } });
    }
    if (operations.length) await Attendance.bulkWrite(operations, { ordered: true });
    res.json(await Attendance.find({ date }).sort({ updatedAt: -1 }));
  } catch (error) { next(error); }
});

export default router;
