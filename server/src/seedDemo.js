import 'dotenv/config';
import mongoose from 'mongoose';
import Attendance from './models/Attendance.js';
import Department from './models/Department.js';
import Employee from './models/Employee.js';
import LeaveRequest from './models/LeaveRequest.js';

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is missing. Create server/.env before seeding demo data.');
  process.exit(1);
}

const demoEmployees = [
  { name: 'Jamie Chen', email: 'jamie.chen.demo@peopledesk.test', department: 'Engineering', role: 'Software Engineer', phone: '+1 555 0101', location: 'Remote', employmentType: 'Full-time', status: 'Active', startDate: new Date('2024-04-15T00:00:00.000Z'), notes: 'Demo employee record.' },
  { name: 'Alex Morgan', email: 'alex.morgan.demo@peopledesk.test', department: 'Design', role: 'Product Designer', phone: '+1 555 0102', location: 'New York', employmentType: 'Full-time', status: 'Active', startDate: new Date('2023-11-06T00:00:00.000Z'), notes: 'Demo employee record.' },
  { name: 'Casey Patel', email: 'casey.patel.demo@peopledesk.test', department: 'Marketing', role: 'Marketing Associate', phone: '+1 555 0103', location: 'Chicago', employmentType: 'Part-time', status: 'Active', startDate: new Date('2025-02-10T00:00:00.000Z'), notes: 'Demo employee record.' },
  { name: 'Taylor Brooks', email: 'taylor.brooks.demo@peopledesk.test', department: 'Finance', role: 'Financial Analyst', phone: '+1 555 0104', location: 'Remote', employmentType: 'Full-time', status: 'On Leave', startDate: new Date('2022-08-22T00:00:00.000Z'), notes: 'Demo employee record.' },
  { name: 'Samira Ali', email: 'samira.ali.demo@peopledesk.test', department: 'Human Resources', role: 'People Coordinator', phone: '+1 555 0105', location: 'Boston', employmentType: 'Intern', status: 'Active', startDate: new Date('2026-06-01T00:00:00.000Z'), notes: 'Demo employee record.' }
];

function localDateWithOffset(days) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

function localDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

try {
  await mongoose.connect(process.env.MONGODB_URI);

  const departments = ['Engineering', 'Design', 'Marketing', 'Finance', 'Human Resources'];
  for (const name of departments) {
    await Department.updateOne({ name }, { $setOnInsert: { name, description: 'Demo department' } }, { upsert: true });
  }

  const employees = [];
  for (const details of demoEmployees) {
    const employee = await Employee.findOneAndUpdate(
      { email: details.email },
      { $setOnInsert: details },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    employees.push(employee);
  }

  const attendanceDate = localDateKey(localDateWithOffset(0));
  const attendanceStatuses = ['Present', 'Late', 'Present', 'Absent', 'Work from home'];
  for (const [index, employee] of employees.entries()) {
    await Attendance.updateOne(
      { employeeId: employee._id, date: attendanceDate },
      { $setOnInsert: { employeeId: employee._id, date: attendanceDate, status: attendanceStatuses[index], note: 'Demo attendance record.' } },
      { upsert: true }
    );
  }

  const leaveSamples = [
    { employeeId: employees[1]._id, type: 'Annual leave', startDate: localDateWithOffset(2), endDate: localDateWithOffset(3), reason: 'Demo: family plans', status: 'Pending' },
    { employeeId: employees[4]._id, type: 'Personal leave', startDate: localDateWithOffset(5), endDate: localDateWithOffset(5), reason: 'Demo: personal appointment', status: 'Approved' }
  ];
  for (const leave of leaveSamples) {
    const { employeeId, type, startDate, endDate, reason, status } = leave;
    await LeaveRequest.updateOne(
      { employeeId, type, startDate, endDate, reason },
      { $setOnInsert: leave },
      { upsert: true }
    );
  }

  console.log(`Demo data is ready: ${employees.length} employees, ${employees.length} attendance records for ${attendanceDate}, and 2 leave requests.`);
  console.log('Seed is safe to rerun: existing matching demo records are left unchanged.');
} catch (error) {
  console.error(`Could not seed demo data: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
