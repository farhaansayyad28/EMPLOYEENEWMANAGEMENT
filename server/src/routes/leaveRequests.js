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
    const overlapping = await LeaveRequest.exists({ employeeId, status: { $in: ['Pending', 'Approved'] }, startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } });
    if (overlapping) return res.status(409).json({ message: 'This employee already has a pending or approved request during those dates.' });
    const request = await LeaveRequest.create({ employeeId, type, startDate, endDate, reason: reason || '' });
    res.status(201).json(await request.populate('employeeId', 'name email department role'));
  } catch (error) { next(error); }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid leave request ID.' });
    if (!statuses.has(req.body.status)) return res.status(400).json({ message: 'Choose a valid leave status.' });
    if (req.body.status === 'Approved') {
      const current = await LeaveRequest.findById(req.params.id);
      if (!current) return res.status(404).json({ message: 'Leave request not found.' });
      const overlapping = await LeaveRequest.exists({ _id: { $ne: current._id }, employeeId: current.employeeId, status: 'Approved', startDate: { $lte: current.endDate }, endDate: { $gte: current.startDate } });
      if (overlapping) return res.status(409).json({ message: 'This employee already has approved leave during those dates.' });
    }
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
