import { Router } from 'express';
import mongoose from 'mongoose';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import User from '../models/User.js';

const router = Router();
// Website: Team access; only Admin accounts can list users or change their roles.
router.use(authenticate, authorize('Admin'));
const roles = new Set(['Admin', 'Manager', 'Employee']);

router.get('/', async (_req, res, next) => {
  try { res.json(await User.find().select('name email role createdAt').sort({ name: 1 })); }
  catch (error) { next(error); }
});

router.patch('/:id/role', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid account ID.' });
    if (!roles.has(req.body.role)) return res.status(400).json({ message: 'Choose Admin, Manager, or Employee.' });
    if (req.params.id === req.user.id) return res.status(400).json({ message: 'You cannot change your own role.' });
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'Account not found.' });
    if (target.role === 'Admin' && req.body.role !== 'Admin' && await User.countDocuments({ role: 'Admin' }) <= 1) return res.status(409).json({ message: 'The workspace must keep at least one Admin.' });
    target.role = req.body.role;
    await target.save();
    res.json({ id: target._id, name: target.name, email: target.email, role: target.role });
  } catch (error) { next(error); }
});

export default router;
