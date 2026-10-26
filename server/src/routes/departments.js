import { Router } from 'express';
import mongoose from 'mongoose';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import Department from '../models/Department.js';
import Employee from '../models/Employee.js';

const router = Router();
router.use(authenticate);
const starterDepartments = ['Engineering', 'Design', 'Marketing', 'Human Resources', 'Finance', 'Operations', 'Sales'];

router.get('/', async (_req, res, next) => {
  try {
    if (!await Department.exists({})) await Department.insertMany(starterDepartments.map((name) => ({ name })), { ordered: false });
    res.json(await Department.find().sort({ name: 1 }));
  } catch (error) { next(error); }
});

router.post('/', authorize('Admin'), async (req, res, next) => {
  try {
    const department = await Department.create({ name: req.body.name, description: req.body.description || '' });
    res.status(201).json(department);
  } catch (error) { next(error); }
});

router.put('/:id', authorize('Admin'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid department ID.' });
    const department = await Department.findByIdAndUpdate(req.params.id, { name: req.body.name, description: req.body.description || '' }, { new: true, runValidators: true });
    if (!department) return res.status(404).json({ message: 'Department not found.' });
    res.json(department);
  } catch (error) { next(error); }
});

router.delete('/:id', authorize('Admin'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid department ID.' });
    const department = await Department.findById(req.params.id);
    if (!department) return res.status(404).json({ message: 'Department not found.' });
    if (await Employee.exists({ department: department.name })) return res.status(409).json({ message: 'Move employees to another department before deleting this one.' });
    await department.deleteOne();
    res.json({ message: 'Department deleted.' });
  } catch (error) { next(error); }
});

export default router;
