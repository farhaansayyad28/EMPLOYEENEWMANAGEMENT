import { Router } from 'express';
import mongoose from 'mongoose';
import authenticate from '../middleware/authenticate.js';
import Employee from '../models/Employee.js';
import LeaveRequest from '../models/LeaveRequest.js';

const router = Router();
router.use(authenticate);
const leaveTypes = new Set(['Annual leave', 'Sick leave', 'Personal leave', 'Unpaid leave']);
const statuses = new Set(['Pending', 'Approved', 'Declined']);

router.get('/', async (_req, res, next) => {
  try { res.json(await LeaveRequest.find().populate('employeeId', 'name email department role').sort({ createdAt: -1 })); }
  catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const { employeeId, type, startDate, endDate, reason } = req.body;
    if (!mongoose.isValidObjectId(employeeId) || !leaveTypes.has(type) || !startDate || !endDate || new Date(endDate) < new Date(startDate)) return res.status(400).json({ message: 'Choose an employee, leave type, and a valid date range.' });
    if (!await Employee.exists({ _id: employeeId })) return res.status(404).json({ message: 'Employee not found.' });
    const request = await LeaveRequest.create({ employeeId, type, startDate, endDate, reason: reason || '' });
    res.status(201).json(await request.populate('employeeId', 'name email department role'));
  } catch (error) { next(error); }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid leave request ID.' });
    if (!statuses.has(req.body.status)) return res.status(400).json({ message: 'Choose a valid leave status.' });
    const request = await LeaveRequest.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true }).populate('employeeId', 'name email department role');
    if (!request) return res.status(404).json({ message: 'Leave request not found.' });
    res.json(request);
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid leave request ID.' });
    const request = await LeaveRequest.findByIdAndDelete(req.params.id);
    if (!request) return res.status(404).json({ message: 'Leave request not found.' });
    res.json({ message: 'Leave request deleted.' });
  } catch (error) { next(error); }
});

export default router;
