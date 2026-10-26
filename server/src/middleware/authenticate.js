import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export default async function authenticate(req, res, next) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select('name email role');
    if (!user) return res.status(401).json({ message: 'This account no longer exists.' });
    req.user = { id: user._id.toString(), name: user.name, email: user.email, role: user.role || 'Employee' };
    next();
  } catch {
    res.status(401).json({ message: 'Your session expired. Please sign in again.' });
  }
}
