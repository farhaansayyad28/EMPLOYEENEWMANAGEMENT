import { Router } from 'express';
import mongoose from 'mongoose';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import Employee from '../models/Employee.js';

const router = Router();
const fields = ['name', 'email', 'department', 'role', 'phone', 'location', 'employmentType', 'status', 'startDate', 'notes'];
router.use(authenticate);

function employeeInput(body) {
  return Object.fromEntries(fields.map((field) => [field, body[field]]));
}

router.get('/', async (_req, res, next) => {
  try {
    const filter = _req.user.role === 'Employee' ? { email: _req.user.email } : {};
    res.json(await Employee.find(filter).sort({ createdAt: -1 }));
  } catch (error) { next(error); }
});

router.post('/', authorize('Admin'), async (req, res, next) => {
  try {
    const employee = await Employee.create(employeeInput(req.body));
    res.status(201).json(employee);
  } catch (error) { next(error); }
});

router.put('/:id', authorize('Admin'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid employee ID.' });
    const employee = await Employee.findByIdAndUpdate(req.params.id, employeeInput(req.body), { new: true, runValidators: true });
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });
    res.json(employee);
  } catch (error) { next(error); }
});

router.delete('/:id', authorize('Admin'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid employee ID.' });
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });
    res.json({ message: 'Employee deleted.' });
  } catch (error) { next(error); }
});

router.get('/export/csv', authorize('Admin', 'Manager'), async (_req, res, next) => {
  try {
    const employees = await Employee.find().sort({ name: 1 });
    const quote = (value) => {
      const cell = String(value ?? '').replaceAll('"', '""');
      return `"${/^[=+@\-]/.test(cell) ? `'${cell}` : cell}"`;
    };
    const csv = [
      ['Name', 'Email', 'Department', 'Role', 'Phone', 'Location', 'Employment type', 'Status', 'Start date', 'Notes'].map(quote).join(','),
      ...employees.map((employee) => [employee.name, employee.email, employee.department, employee.role, employee.phone, employee.location, employee.employmentType, employee.status, employee.startDate?.toISOString().slice(0, 10), employee.notes].map(quote).join(','))
    ].join('\r\n');
    const exportPath = resolve('exports', 'employees.csv');
    await mkdir(dirname(exportPath), { recursive: true });
    await writeFile(exportPath, `\uFEFF${csv}`, 'utf8');
    res.download(exportPath, 'employees.csv');
  } catch (error) { next(error); }
});

export default router;
