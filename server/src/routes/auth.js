import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import authenticate from '../middleware/authenticate.js';

const router = Router();

function makeToken(user) {
  return jwt.sign({ id: user._id.toString(), name: user.name, email: user.email, role: user.role || 'Employee' }, process.env.JWT_SECRET, { expiresIn: '12h' });
}

async function ensureRole(user) {
  if (!user.role) {
    let admin = await User.findOne({ role: 'Admin' });
    if (!admin) {
      admin = await User.findOne().sort({ createdAt: 1, _id: 1 });
      if (admin) {
        admin.role = 'Admin';
        await admin.save();
      }
    }
    user.role = admin && admin._id.equals(user._id) ? 'Admin' : 'Employee';
    await user.save();
  }
  return user;
}

function publicUser(user) {
  return { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
}

router.post('/register', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email, and password are required.' });
    if (password.length < 8) return res.status(400).json({ message: 'Use a password with at least 8 characters.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const role = await User.countDocuments() === 0 ? 'Admin' : 'Employee';
    const user = await User.create({ name, email, passwordHash, role });
    res.status(201).json({ token: makeToken(user), user: publicUser(user) });
  } catch (error) { next(error); }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }
    await ensureRole(user);
    res.json({ token: makeToken(user), user: publicUser(user) });
  } catch (error) { next(error); }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Account not found.' });
    await ensureRole(user);
    res.json({ token: makeToken(user), user: publicUser(user) });
  } catch (error) { next(error); }
});

export default router;
