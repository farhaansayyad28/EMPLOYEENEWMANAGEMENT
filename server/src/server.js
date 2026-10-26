import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import employeeRoutes from './routes/employees.js';
import authRoutes from './routes/auth.js';
import authenticate from './middleware/authenticate.js';
import Employee from './models/Employee.js';

const app = express();
app.use(cors());
app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/soap', express.text({ type: ['text/xml', 'application/soap+xml'] }));
app.post('/api/soap', authenticate, async (req, res, next) => {
  try {
    const xml = typeof req.body === 'string' ? req.body : '';
    if (!/GetEmployees/i.test(xml)) {
      res.type('application/soap+xml').status(400).send('<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><soap:Fault><faultcode>soap:Client</faultcode><faultstring>Supported operation: GetEmployees</faultstring></soap:Fault></soap:Body></soap:Envelope>');
      return;
    }
    const escapeXml = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
    const employees = await Employee.find().sort({ createdAt: -1 });
    const items = employees.map((employee) => `<Employee><Id>${escapeXml(employee._id)}</Id><Name>${escapeXml(employee.name)}</Name><Email>${escapeXml(employee.email)}</Email><Department>${escapeXml(employee.department)}</Department><Role>${escapeXml(employee.role)}</Role></Employee>`).join('');
    const response = `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetEmployeesResponse>${items}</GetEmployeesResponse></soap:Body></soap:Envelope>`;
    res.type('application/soap+xml').send(response);
  } catch (error) { next(error); }
});

app.use((error, _req, res, _next) => {
  if (error.code === 11000) return res.status(409).json({ message: 'An account or employee with this email already exists.' });
  if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
  console.error(error);
  res.status(500).json({ message: 'Something went wrong on the server.' });
});

const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('MONGODB_URI is missing. Copy server/.env.example to server/.env and set your MongoDB connection string.');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing. Add a long random value to server/.env.');
  process.exit(1);
}

try {
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');
  app.listen(port, () => console.log(`API running at http://localhost:${port}`));
} catch (error) {
  console.error('Could not connect to MongoDB:', error.message);
  process.exit(1);
}
