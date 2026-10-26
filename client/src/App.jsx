import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Users, UserPlus, Search, Pencil, Trash2, X, Building2, UserRound, ChevronDown, MoreHorizontal, Download, FileCode2, Phone, MapPin, CalendarDays, ArrowUpDown, Mail, Clock3, UserCheck, UserX, LayoutDashboard, ClipboardCheck, Plane, ChartNoAxesCombined, Plus, Check, Ban, BriefcaseBusiness } from 'lucide-react';
import AuthScreen from './AuthScreen.jsx';

// Shared Axios client: sends the signed-in user's token to the Express API.
const api = axios.create({ baseURL: 'http://localhost:5000/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('peopleDeskToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
const blank = { name: '', email: '', department: '', role: '', phone: '', location: '', employmentType: 'Full-time', status: 'Active', startDate: new Date().toISOString().slice(0, 10), notes: '' };
const colors = ['violet', 'blue', 'amber', 'rose', 'teal', 'orange'];
const initials = (name) => name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

// Small statistic card used on the Overview page.
function SummaryCard({ icon: Icon, tone, label, value }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={18} /></div><div><span>{label}</span><strong>{value}</strong></div></div>;
}

const localToday = () => { const date = new Date(); date.setMinutes(date.getMinutes() - date.getTimezoneOffset()); return date.toISOString().slice(0, 10); };

// Website: Time & leave → Attendance (daily register and history).
function AttendanceModule({ employees, role }) {
  const canManage = role === 'Admin' || role === 'Manager';
  const [date, setDate] = useState(localToday());
  const [records, setRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState('day');
  const [fromDate, setFromDate] = useState(`${localToday().slice(0, 7)}-01`);
  const [toDate, setToDate] = useState(localToday());
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  useEffect(() => {
    let current = true;
    setLoading(true); setMessage('');
    api.get('/attendance', { params: { date } }).then(({ data }) => {
      if (current) setRecords(Object.fromEntries(data.map((record) => [record.employeeId, record.status])));
    }).catch((error) => { if (current) setMessage(error.response?.data?.message || 'Could not load attendance.'); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [date]);
  useEffect(() => {
    if (mode !== 'history') return;
    let current = true;
    setHistoryLoading(true); setMessage('');
    api.get('/attendance/history', { params: { from: fromDate, to: toDate } }).then(({ data }) => { if (current) setHistory(data); })
      .catch((error) => { if (current) setMessage(error.response?.data?.message || 'Could not load attendance history.'); })
      .finally(() => { if (current) setHistoryLoading(false); });
    return () => { current = false; };
  }, [mode, fromDate, toDate]);
  async function saveAttendance() {
    setSaving(true); setMessage('');
    try {
      const { data } = await api.put('/attendance/day', { date, records: employees.map((employee) => ({ employeeId: employee._id, status: records[employee._id] || 'Not marked' })) });
      setRecords(Object.fromEntries(data.map((record) => [record.employeeId, record.status])));
      setMessage('Attendance saved to MongoDB.');
    } catch (error) { setMessage(error.response?.data?.message || 'Could not save attendance.'); }
    finally { setSaving(false); }
  }
  const marked = Object.values(records).filter((status) => status && status !== 'Not marked').length;
  const setAllPresent = () => setRecords(Object.fromEntries(employees.map((employee) => [employee._id, 'Present'])));
  const historyTotals = history.reduce((totals, record) => { totals[record.status] = (totals[record.status] || 0) + 1; return totals; }, {});
  return <section className="module-card">
    <div className="module-header attendance-heading"><div><div className="eyebrow">TIME &amp; ATTENDANCE</div><h2>Attendance</h2><p>Record the daily register or review historical attendance.</p></div><div className="attendance-mode-tabs"><button className={mode === 'day' ? 'selected' : ''} onClick={() => setMode('day')}>Daily register</button><button className={mode === 'history' ? 'selected' : ''} onClick={() => setMode('history')}>History &amp; totals</button></div></div>
    {mode === 'day' ? <><div className="module-header-actions attendance-day-actions"><label className="date-control">Attendance date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><button className="secondary-button" onClick={setAllPresent} disabled={!employees.length}>Mark all present</button><button className="primary-button" onClick={saveAttendance} disabled={saving || loading || !employees.length}><Check size={15} />{saving ? 'Saving…' : 'Save attendance'}</button></div><div className="module-summary"><span><strong>{marked}</strong> of {employees.length} marked</span><span><i className="legend-dot present-dot" />Present</span><span><i className="legend-dot late-dot" />Late</span><span><i className="legend-dot absent-dot" />Absent</span><span><i className="legend-dot remote-dot" />Work from home</span></div>{message && <div className={message.startsWith('Could not') ? 'form-error module-message' : 'success-banner module-message'}>{message}</div>}<div className="module-list-head"><span>EMPLOYEE</span><span>DEPARTMENT</span><span>ATTENDANCE</span></div>{loading ? <div className="module-empty">Loading attendance…</div> : employees.length ? <div className="attendance-list">{employees.map((employee, index) => <div className="attendance-row" key={employee._id}><div className="employee-cell"><div className={`employee-avatar ${colors[index % colors.length]}`}>{initials(employee.name)}</div><div><strong>{employee.name}</strong><small>{employee.role}</small></div></div><span className="department-pill">{employee.department}</span>{canManage ? <select className={`attendance-select ${(records[employee._id] || 'not-marked').toLowerCase().replaceAll(' ', '-')}`} value={records[employee._id] || 'Not marked'} onChange={(event) => setRecords((current) => ({ ...current, [employee._id]: event.target.value }))}><option>Not marked</option><option>Present</option><option>Late</option><option>Absent</option><option>Work from home</option></select> : <span className={`status-pill attendance-${(records[employee._id] || 'Not marked').toLowerCase().replaceAll(' ', '-')}`}>{records[employee._id] || 'Not marked'}</span>}</div>)}</div> : <div className="module-empty"><ClipboardCheck size={26} /><strong>Add employees before taking attendance</strong><span>Once your team is in the directory, daily attendance appears here.</span></div>}</> : <><div className="history-range"><label className="date-control">From<input type="date" value={fromDate} max={toDate} onChange={(event) => setFromDate(event.target.value)} /></label><label className="date-control">To<input type="date" value={toDate} min={fromDate} max={localToday()} onChange={(event) => setToDate(event.target.value)} /></label><span className="history-record-count"><strong>{history.length}</strong> attendance records</span></div><div className="history-summary"><div><span>Present</span><strong>{historyTotals.Present || 0}</strong></div><div><span>Late</span><strong>{historyTotals.Late || 0}</strong></div><div><span>Absent</span><strong>{historyTotals.Absent || 0}</strong></div><div><span>Work from home</span><strong>{historyTotals['Work from home'] || 0}</strong></div></div>{message && <div className="form-error module-message">{message}</div>}{historyLoading ? <div className="module-empty">Loading attendance history…</div> : history.length ? <div className="table-wrap"><table className="history-table"><thead><tr><th>DATE</th><th>EMPLOYEE</th><th>DEPARTMENT</th><th>STATUS</th></tr></thead><tbody>{history.map((record) => <tr key={record._id}><td>{new Date(`${record.date}T00:00:00`).toLocaleDateString()}</td><td><strong>{record.employeeId?.name || 'Deleted employee'}</strong></td><td>{record.employeeId?.department || '—'}</td><td><span className={`status-pill attendance-${record.status.toLowerCase().replaceAll(' ', '-')}`}>{record.status}</span></td></tr>)}</tbody></table></div> : <div className="module-empty"><ClipboardCheck size={25} /><strong>No attendance records in this date range</strong><span>Choose a different range or save a daily register first.</span></div>}</>}
  </section>;
}

// Website: Time & leave → Leave requests (submit, review, and calendar).
function LeaveModule({ employees, role }) {
  const canReview = role === 'Admin' || role === 'Manager';
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ employeeId: '', type: 'Annual leave', startDate: localToday(), endDate: localToday(), reason: '' });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [leaveView, setLeaveView] = useState('requests');
  const [calendarMonth, setCalendarMonth] = useState(() => { const today = new Date(`${localToday()}T00:00:00`); return new Date(today.getFullYear(), today.getMonth(), 1); });
  async function loadRequests() { setLoading(true); try { setRequests((await api.get('/leave-requests')).data); setError(''); } catch (requestError) { setError(requestError.response?.data?.message || 'Could not load leave requests.'); } finally { setLoading(false); } }
  useEffect(() => { loadRequests(); }, []);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try { await api.post('/leave-requests', form); setForm({ employeeId: '', type: 'Annual leave', startDate: localToday(), endDate: localToday(), reason: '' }); setNotice('Leave request added.'); await loadRequests(); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Could not add the leave request.'); }
    finally { setBusy(false); }
  }
  async function updateStatus(request, status) { try { await api.patch(`/leave-requests/${request._id}/status`, { status }); await loadRequests(); } catch (requestError) { setError(requestError.response?.data?.message || 'Could not update the request.'); } }
  async function removeRequest(request) { if (!window.confirm('Delete this leave request?')) return; try { await api.delete(`/leave-requests/${request._id}`); await loadRequests(); } catch (requestError) { setError(requestError.response?.data?.message || 'Could not delete the request.'); } }
  const pending = requests.filter((request) => request.status === 'Pending').length;
  const approvedLeaves = requests.filter((request) => request.status === 'Approved');
  const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const dayOffset = (monthStart.getDay() + 6) % 7;
  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const calendarCells = Array.from({ length: Math.ceil((dayOffset + daysInMonth) / 7) * 7 }, (_, index) => { const day = index - dayOffset + 1; return day > 0 && day <= daysInMonth ? day : null; });
  const approvedOnDate = (dateString) => approvedLeaves.filter((request) => new Date(request.startDate).toISOString().slice(0, 10) <= dateString && new Date(request.endDate).toISOString().slice(0, 10) >= dateString);
  return <div className="leave-layout"><section className="module-card leave-form-card"><div className="eyebrow">TIME OFF</div><h2>New leave request</h2><p className="module-subtitle">Create a request, then review and approve it in the list.</p><form onSubmit={submit} className="leave-form"><label>Employee<select required value={form.employeeId} onChange={(event) => setForm({ ...form, employeeId: event.target.value })}><option value="">Select employee</option>{employees.map((employee) => <option key={employee._id} value={employee._id}>{employee.name}</option>)}</select></label><label>Leave type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option>Annual leave</option><option>Sick leave</option><option>Personal leave</option><option>Unpaid leave</option></select></label><div className="form-grid"><label>Start date<input required type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} /></label><label>End date<input required type="date" min={form.startDate} value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} /></label></div><label>Reason <span className="optional-label">(optional)</span><textarea rows="3" maxLength="500" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} placeholder="Add context for the manager…" /></label>{error && <div className="form-error">{error}</div>}{notice && <div className="success-banner">{notice}</div>}<button className="primary-button" disabled={busy || !employees.length}><Plus size={15} />{busy ? 'Submitting…' : 'Add leave request'}</button></form></section>
    <section className="module-card leave-list-card"><div className="module-header compact"><div><div className="eyebrow">TIME OFF</div><h2>Leave management <span className="title-count">{requests.length}</span></h2><p>Review requests or see approved leave on the team calendar.</p></div><span className="pending-count"><Clock3 size={14} />{pending} pending</span></div><div className="leave-view-toggle"><button className={leaveView === 'requests' ? 'selected' : ''} onClick={() => setLeaveView('requests')}>Requests</button><button className={leaveView === 'calendar' ? 'selected' : ''} onClick={() => setLeaveView('calendar')}><CalendarDays size={14} />Leave calendar</button></div>{error && <div className="form-error module-message">{error}</div>}{loading ? <div className="module-empty">Loading requests…</div> : leaveView === 'requests' ? requests.length ? <div className="leave-request-list">{requests.map((request) => <article className="leave-request" key={request._id}><div className="leave-type-icon"><Plane size={17} /></div><div className="leave-info"><strong>{request.employeeId?.name || 'Unknown employee'}</strong><span>{request.type} · {new Date(request.startDate).toLocaleDateString()} – {new Date(request.endDate).toLocaleDateString()}</span>{request.reason && <small>{request.reason}</small>}</div><div className="leave-controls"><span className={`status-pill leave-${request.status.toLowerCase()}`}>{request.status}</span>{canReview && request.status === 'Pending' && <><button className="icon-action approve-action" title="Approve request" onClick={() => updateStatus(request, 'Approved')}><Check size={16} /></button><button className="icon-action decline-action" title="Decline request" onClick={() => updateStatus(request, 'Declined')}><Ban size={16} /></button></>}{(canReview || (role === 'Employee' && request.status === 'Pending')) && <button className="icon-action" title={role === 'Employee' ? 'Cancel request' : 'Delete request'} onClick={() => removeRequest(request)}><Trash2 size={15} /></button>}</div></article>)}</div> : <div className="module-empty"><Plane size={26} /><strong>No leave requests yet</strong><span>Requests you add will appear here for review.</span></div> : <div className="leave-calendar"><div className="calendar-month-controls"><button aria-label="Previous month" onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</button><strong>{monthStart.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</strong><button aria-label="Next month" onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</button></div><div className="leave-calendar-grid calendar-weekdays">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}</div><div className="leave-calendar-grid">{calendarCells.map((day, index) => { const dateString = day ? `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : ''; const dayLeaves = day ? approvedOnDate(dateString) : []; return <div className={`calendar-day ${day ? '' : 'outside-month'} ${dateString === localToday() ? 'today' : ''}`} key={`${dateString}-${index}`}>{day && <><span className="calendar-day-number">{day}</span>{dayLeaves.slice(0, 2).map((request) => <span className="calendar-leave-chip" key={request._id} title={`${request.employeeId?.name || 'Employee'} · ${request.type}`}>{request.employeeId?.name || 'Employee'}</span>)}{dayLeaves.length > 2 && <small className="calendar-more">+{dayLeaves.length - 2} more</small>}</>}</div>; })}</div><div className="calendar-footnote"><span><i className="legend-dot present-dot" />Approved leave</span><span>{approvedLeaves.length} approved request{approvedLeaves.length === 1 ? '' : 's'} on calendar</span></div>{!approvedLeaves.length && <p className="calendar-empty-note">Approved leave requests will appear on this calendar.</p>}</div>}</section></div>;
}

// Website: People → Departments (team cards and headcount).
function DepartmentModule({ departments, employees, onReload, onSelectDepartment, canManage }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  async function addDepartment(event) { event.preventDefault(); setSaving(true); setError(''); try { await api.post('/departments', { name, description }); setName(''); setDescription(''); await onReload(); } catch (requestError) { setError(requestError.response?.data?.message || 'Could not add department.'); } finally { setSaving(false); } }
  async function deleteDepartment(department) { if (!window.confirm(`Delete the ${department.name} department?`)) return; setError(''); try { await api.delete(`/departments/${department._id}`); await onReload(); } catch (requestError) { setError(requestError.response?.data?.message || 'Could not delete department.'); } }
  const allDepartments = [...departments, ...[...new Set(employees.map((employee) => employee.department))].filter((name) => !departments.some((item) => item.name === name)).map((name) => ({ _id: name, name, description: 'Existing employee team', legacy: true }))];
  return <div className={`department-layout ${canManage ? '' : 'read-only-departments'}`}>{canManage && <section className="module-card department-add-card"><div className="eyebrow">ORGANIZATION</div><h2>Departments</h2><p className="module-subtitle">Group employees into teams and see each department’s headcount.</p><form className="department-form" onSubmit={addDepartment}><label>Department name<input required maxLength="60" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Customer Success" /></label><label>Description <span className="optional-label">(optional)</span><input maxLength="240" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What this team does" /></label>{error && <div className="form-error">{error}</div>}<button className="primary-button" disabled={saving}><Plus size={15} />{saving ? 'Adding…' : 'Add department'}</button></form></section>}<section className="module-card department-directory"><div className="module-header compact"><div><div className="eyebrow">TEAMS</div><h2>Department directory <span className="title-count">{allDepartments.length}</span></h2><p>{canManage ? 'Departments containing employees can’t be deleted until they’re empty.' : 'Browse teams and their headcount.'}</p></div></div><div className="department-grid">{allDepartments.map((department, index) => { const team = employees.filter((employee) => employee.department === department.name); const active = team.filter((employee) => (employee.status || 'Active') === 'Active').length; return <article className="department-card" key={department._id}><div className={`department-icon tone-${index % 4}`}><Building2 size={18} /></div><div className="department-card-top"><h3>{department.name}</h3>{canManage && !department.legacy && <button className="icon-action" title="Delete department" onClick={() => deleteDepartment(department)}><Trash2 size={15} /></button>}</div><p>{department.description || 'Team department'}</p><div className="department-metrics"><span><strong>{team.length}</strong> people</span><span><strong>{active}</strong> active</span></div><button className="department-view-link" onClick={() => onSelectDepartment(department.name)}>View employees <span>→</span></button></article>; })}</div></section></div>;
}

// Website: Team access (Admin-only account role controls).
function AccessModule({ user }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  async function loadAccounts() { setLoading(true); try { setAccounts((await api.get('/users')).data); setError(''); } catch (requestError) { setError(requestError.response?.data?.message || 'Could not load accounts.'); } finally { setLoading(false); } }
  useEffect(() => { loadAccounts(); }, []);
  async function changeRole(account, role) { setError(''); try { const { data } = await api.patch(`/users/${account._id}/role`, { role }); setAccounts((current) => current.map((item) => item._id === account._id ? { ...item, role: data.role } : item)); } catch (requestError) { setError(requestError.response?.data?.message || 'Could not update account role.'); await loadAccounts(); } }
  const roleDescriptions = { Admin: 'Full workspace access and account role management.', Manager: 'Can review the directory, manage attendance, and review leave.', Employee: 'Can access their own profile, attendance, and leave requests.' };
  return <section className="module-card access-module"><div className="module-header"><div><div className="eyebrow">WORKSPACE SECURITY</div><h2>Team access</h2><p>Choose what each account can see and manage. Role changes apply immediately.</p></div><span className="access-count">{accounts.length} account{accounts.length === 1 ? '' : 's'}</span></div>{error && <div className="form-error module-message">{error}</div>}{loading ? <div className="module-empty">Loading accounts…</div> : <><div className="access-role-guide">{Object.entries(roleDescriptions).map(([role, description]) => <div key={role}><span className={`role-badge ${role.toLowerCase()}`}>{role}</span><p>{description}</p></div>)}</div><div className="access-table"><div className="access-table-head"><span>ACCOUNT</span><span>ROLE</span></div>{accounts.map((account) => <div className="access-row" key={account._id}><div className="access-user"><div className="user-avatar">{initials(account.name)}</div><span><strong>{account.name}{account._id === user.id ? ' (you)' : ''}</strong><small>{account.email}</small></span></div>{account._id === user.id ? <span className={`role-badge ${account.role.toLowerCase()}`}>{account.role}</span> : <select aria-label={`Role for ${account.name}`} value={account.role} onChange={(event) => changeRole(account, event.target.value)}><option>Employee</option><option>Manager</option><option>Admin</option></select>}</div>)}</div><p className="access-footnote">New registrations are Employees by default. The first account is made Admin. Only an Admin can change roles, and the workspace always keeps at least one Admin.</p></>}</section>;
}

// Main signed-in workspace: navigation, Overview, directory, and feature modules.
function EmployeeDashboard({ user, onLogout }) {
  const [employees, setEmployees] = useState([]);
  const [departmentRecords, setDepartmentRecords] = useState([]);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('All departments');
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [activeModule, setActiveModule] = useState('dashboard');
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [dashboardRequests, setDashboardRequests] = useState([]);
  const [dashboardOpsError, setDashboardOpsError] = useState('');
  const [openRowMenu, setOpenRowMenu] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [sortOrder, setSortOrder] = useState('Newest first');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewEmployee, setViewEmployee] = useState(null);
  const pageSize = 8;

  // Website: Reports → Employee CSV download.
  async function exportCsv() {
    try {
      const response = await api.get('/employees/export/csv', { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a'); link.href = url; link.download = 'employees.csv'; link.click(); URL.revokeObjectURL(url);
      setNotice('Employee CSV downloaded. A copy was also saved on the server.');
    } catch (requestError) { setError(requestError.response?.data?.message || 'Could not export employees.'); }
    window.setTimeout(() => setNotice(''), 3000);
  }

  // Website: Reports → SOAP XML demo button.
  async function testSoap() {
    const envelope = '<?xml version="1.0"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetEmployees /></soap:Body></soap:Envelope>';
    try {
      const response = await api.post('/soap', envelope, { headers: { 'Content-Type': 'text/xml' }, responseType: 'text' });
      const count = (response.data.match(/<Employee>/g) || []).length;
      setNotice(`SOAP XML request succeeded. ${count} employee record(s) returned.`);
    } catch (requestError) { setError(requestError.response?.data?.message || 'SOAP request failed.'); }
    window.setTimeout(() => setNotice(''), 3000);
  }

  // Loads the directory from GET /api/employees.
  async function loadEmployees() {
    setLoading(true);
    try { setEmployees((await api.get('/employees')).data); setError(''); }
    catch { setError('Could not connect to the API. Start the backend and check your MongoDB connection.'); }
    finally { setLoading(false); }
  }
  async function loadDepartments() {
    try { setDepartmentRecords((await api.get('/departments')).data); }
    catch { /* The department view will show its own API feedback when opened. */ }
  }
  useEffect(() => { loadEmployees(); }, []);
  useEffect(() => { loadDepartments(); }, []);
  useEffect(() => {
    if (activeModule !== 'dashboard') return;
    Promise.all([api.get('/attendance', { params: { date: localToday() } }), api.get('/leave-requests')])
      .then(([attendanceResponse, leaveResponse]) => { setTodayAttendance(attendanceResponse.data); setDashboardRequests(leaveResponse.data); setDashboardOpsError(''); })
      .catch(() => setDashboardOpsError('Could not refresh attendance and leave summaries.'));
  }, [activeModule, employees.length]);

  const visibleEmployees = useMemo(() => employees.filter((employee) => {
    const text = `${employee.name} ${employee.email} ${employee.role} ${employee.department}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (department === 'All departments' || employee.department === department) && (statusFilter === 'All statuses' || (employee.status || 'Active') === statusFilter);
  }).sort((a, b) => sortOrder === 'Name A–Z' ? a.name.localeCompare(b.name) : sortOrder === 'Name Z–A' ? b.name.localeCompare(a.name) : sortOrder === 'Oldest first' ? new Date(a.startDate || a.createdAt) - new Date(b.startDate || b.createdAt) : new Date(b.createdAt) - new Date(a.createdAt)), [employees, query, department, statusFilter, sortOrder]);
  const pageCount = Math.max(1, Math.ceil(visibleEmployees.length / pageSize));
  const pageEmployees = visibleEmployees.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  useEffect(() => { setCurrentPage((page) => Math.min(page, pageCount)); }, [pageCount]);

  function openCreate() { setEditingId(null); setForm(blank); setError(''); setModalOpen(true); }
  function openEdit(employee) {
    setEditingId(employee._id);
    setForm({ ...blank, ...employee, startDate: employee.startDate ? new Date(employee.startDate).toISOString().slice(0, 10) : '' });
    setError(''); setModalOpen(true);
  }
  // Add/Edit employee modal: POST for new records, PUT for edits.
  async function saveEmployee(event) {
    event.preventDefault(); setError('');
    try {
      if (editingId) await api.put(`/employees/${editingId}`, form);
      else await api.post('/employees', form);
      await loadEmployees(); setModalOpen(false); setForm(blank);
      setNotice(editingId ? 'Employee details updated.' : 'Employee added to your team.');
      window.setTimeout(() => setNotice(''), 2800);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save employee. Check that the API is running.');
    }
  }
  async function deleteEmployee(employee) {
    if (!window.confirm(`Remove ${employee.name} from the employee list?`)) return;
    try { await api.delete(`/employees/${employee._id}`); await loadEmployees(); setNotice('Employee removed.'); window.setTimeout(() => setNotice(''), 2800); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Could not delete employee.'); }
  }
  async function changeStatus(employee, status) {
    try { const { _id, ...employeeData } = employee; await api.put(`/employees/${_id}`, { ...employeeData, status }); await loadEmployees(); setNotice(`${employee.name} marked ${status.toLowerCase()}.`); window.setTimeout(() => setNotice(''), 2800); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Could not update employee status.'); }
  }

  const departmentsInUse = [...new Set(employees.map((employee) => employee.department))];
  const isAdmin = user.role === 'Admin';
  const isManager = user.role === 'Manager';
  const isEmployee = user.role === 'Employee';
  const canManageWorkforce = isAdmin || isManager;
  const departmentOptions = (isEmployee ? departmentsInUse : [...new Set([...departmentsInUse, ...departmentRecords.map((item) => item.name)])]).sort();
  const activeCount = employees.filter((employee) => (employee.status || 'Active') === 'Active').length;
  const leaveCount = employees.filter((employee) => employee.status === 'On Leave').length;
  const pendingDashboardRequests = dashboardRequests.filter((request) => request.status === 'Pending');
  const attendanceTotals = { Present: todayAttendance.filter((record) => record.status === 'Present').length, Late: todayAttendance.filter((record) => record.status === 'Late').length, Absent: todayAttendance.filter((record) => record.status === 'Absent').length, 'Work from home': todayAttendance.filter((record) => record.status === 'Work from home').length };
  const thisMonthHires = employees.filter((employee) => { const date = new Date(employee.startDate || employee.createdAt); const now = new Date(); return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear(); }).length;
  function goToDirectory(nextDepartment = 'All departments') {
    setActiveModule('employees');
    setDepartment(nextDepartment);
    setStatusFilter('All statuses');
    setQuery('');
    setCurrentPage(1);
    document.getElementById('employee-directory')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  const moduleTitles = { dashboard: 'Overview', employees: isEmployee ? 'My profile' : 'Employee directory', departments: 'Departments', attendance: isEmployee ? 'My attendance' : 'Attendance', leave: isEmployee ? 'My leave' : 'Leave management', reports: 'Reports & exports', access: 'Team access' };
  const moduleDescriptions = { dashboard: 'A live view of your people operations.', employees: isEmployee ? 'Review your employee profile and personal details.' : 'Search, review, and manage employee records.', departments: 'Organize teams and see how your people are distributed.', attendance: isEmployee ? 'Review your own daily and historical attendance.' : 'Keep a daily register and review attendance history.', leave: isEmployee ? 'Request time off and track your leave requests.' : 'Create, review, and approve team time off.', reports: 'Export and review useful people data for your team.', access: 'Manage workspace accounts and their permissions.' };

  return <div className="app-shell">
    <main className="main-content">
      {/* Website: top navigation, including the People and Time & leave hover menus. */}
      <header className="topbar">
        <a className="brand topbar-brand" href="#overview" onClick={(event) => { event.preventDefault(); setActiveModule('dashboard'); }}><span className="brand-mark"><Users size={19} strokeWidth={2.5} /></span><span>people<span className="brand-light">desk</span></span></a>
        <nav className="topnav" aria-label="Main navigation">
          <button className={`topnav-link ${activeModule === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveModule('dashboard')}><LayoutDashboard size={15} />Overview</button>
          <div className="topnav-group"><button className={`topnav-trigger ${['employees', 'departments'].includes(activeModule) ? 'active' : ''}`} aria-haspopup="true">{isEmployee ? 'My profile' : 'People'} <ChevronDown size={14} /></button><div className="topnav-menu"><div className="topnav-menu-label">{isEmployee ? 'MY PROFILE' : 'PEOPLE'}</div><button onClick={() => goToDirectory()}><Users size={15} /><span><strong>{isEmployee ? 'My employee profile' : 'Employee directory'}</strong><small>{employees.length} {isEmployee ? 'profile' : 'team members'}</small></span></button>{!isEmployee && <button onClick={() => setActiveModule('departments')}><Building2 size={15} /><span><strong>Departments</strong><small>Teams and headcount</small></span></button>}{isAdmin && <button onClick={() => { setActiveModule('employees'); openCreate(); }}><UserPlus size={15} /><span><strong>Add employee</strong><small>Create a team profile</small></span></button>}{canManageWorkforce && departmentsInUse.length > 0 && <><div className="topnav-menu-label menu-divider">DEPARTMENT SHORTCUTS</div>{departmentsInUse.slice(0, 6).map((item) => <button className="department-shortcut" key={item} onClick={() => goToDirectory(item)}><span className="submenu-dot" />{item}<span className="submenu-count">{employees.filter((employee) => employee.department === item).length}</span></button>)}</>}</div></div>
          <div className="topnav-group"><button className={`topnav-trigger ${['attendance', 'leave'].includes(activeModule) ? 'active' : ''}`} aria-haspopup="true">{isEmployee ? 'My time off' : 'Time & leave'} <ChevronDown size={14} /></button><div className="topnav-menu"><div className="topnav-menu-label">{isEmployee ? 'MY WORK' : 'WORKFORCE'}</div><button onClick={() => setActiveModule('attendance')}><ClipboardCheck size={15} /><span><strong>{isEmployee ? 'My attendance' : 'Attendance'}</strong><small>{isEmployee ? 'View your attendance history' : 'Daily team register and history'}</small></span></button><button onClick={() => setActiveModule('leave')}><Plane size={15} /><span><strong>{isEmployee ? 'Request leave' : 'Leave requests'}</strong><small>{isEmployee ? 'Submit and track your time off' : 'Review and approve requests'}</small></span></button></div></div>
          {canManageWorkforce && <div className="topnav-group"><button className={`topnav-trigger ${activeModule === 'reports' ? 'active' : ''}`} aria-haspopup="true">Reports <ChevronDown size={14} /></button><div className="topnav-menu"><div className="topnav-menu-label">REPORTS &amp; TOOLS</div><button onClick={() => setActiveModule('reports')}><ChartNoAxesCombined size={15} /><span><strong>Workforce summary</strong><small>Headcount and department totals</small></span></button><button onClick={exportCsv}><Download size={15} /><span><strong>Employee CSV</strong><small>Export employee records</small></span></button><button onClick={testSoap}><FileCode2 size={15} /><span><strong>SOAP XML demo</strong><small>Test the learning endpoint</small></span></button></div></div>}
          {isAdmin && <button className={`topnav-link ${activeModule === 'access' ? 'active' : ''}`} onClick={() => setActiveModule('access')}><UserCheck size={15} />Team access</button>}
        </nav>
        <div className="topbar-right"><span className="today-label">{user.name}</span><span className={`role-badge topbar-role ${user.role.toLowerCase()}`}>{user.role}</span><button className="signout-button" onClick={onLogout}>Sign out</button><div className="user-avatar">{initials(user.name)}</div></div>
      </header>
      <section className="page-content">
        <div className="heading-row"><div><div className="eyebrow">PEOPLE OPERATIONS</div><h1>{moduleTitles[activeModule]} {['employees', 'departments'].includes(activeModule) && <span className="title-count">{activeModule === 'employees' ? employees.length : departmentRecords.length}</span>}</h1><p className="subtitle">{moduleDescriptions[activeModule]}</p></div>{isAdmin && ['dashboard', 'employees'].includes(activeModule) && <div className="heading-actions"><button className="primary-button" onClick={() => { setActiveModule('employees'); openCreate(); }}><UserPlus size={17} /> Add employee</button></div>}</div>

        {/* Website: Overview dashboard cards and people-operations summaries. */}
        {activeModule === 'dashboard' && <><div className="stats-row">
          <SummaryCard icon={Users} tone="purple" label="Total employees" value={employees.length} />
          <SummaryCard icon={UserCheck} tone="green" label="Active employees" value={activeCount} />
          <SummaryCard icon={Clock3} tone="orange" label="On leave" value={leaveCount} />
          <SummaryCard icon={CalendarDays} tone="blue" label="Joined this month" value={thisMonthHires} />
          <SummaryCard icon={ClipboardCheck} tone="green" label="Present today" value={attendanceTotals.Present} />
          <SummaryCard icon={Plane} tone="orange" label="Pending leave" value={pendingDashboardRequests.length} />
        </div><div className="overview-grid"><section className="module-card overview-welcome"><div className="welcome-orb"><Users size={22} /></div><div><div className="eyebrow">YOUR WORKSPACE</div><h2>Welcome back, {user.name.split(' ')[0]}</h2><p>Manage your people, time off, and daily attendance from one place.</p></div><div className="quick-links"><button onClick={() => { setActiveModule('employees'); openCreate(); }}><UserPlus size={15} />Add a new teammate</button><button onClick={() => setActiveModule('attendance')}><ClipboardCheck size={15} />Record today’s attendance</button><button onClick={() => setActiveModule('leave')}><Plane size={15} />Review leave requests</button></div></section><section className="module-card dashboard-ops"><div className="module-header compact"><div><div className="eyebrow">TODAY AT A GLANCE</div><h2>Attendance &amp; time off</h2><p>{new Date(`${localToday()}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p></div><button className="text-button" onClick={() => setActiveModule('attendance')}>Open attendance →</button></div>{dashboardOpsError && <div className="form-error module-message">{dashboardOpsError}</div>}<div className="ops-grid"><div className="attendance-overview"><div className="ops-main-number">{todayAttendance.length}<small> marked today</small></div><div className="ops-statuses"><span><i className="legend-dot present-dot" />{attendanceTotals.Present} present</span><span><i className="legend-dot late-dot" />{attendanceTotals.Late} late</span><span><i className="legend-dot absent-dot" />{attendanceTotals.Absent} absent</span><span><i className="legend-dot remote-dot" />{attendanceTotals['Work from home']} remote</span></div></div><div className="pending-overview"><div className="pending-overview-top"><strong>Leave requests to review</strong><button onClick={() => setActiveModule('leave')}>See all</button></div>{pendingDashboardRequests.slice(0, 3).map((request) => <div className="pending-preview" key={request._id}><span className="pending-avatar">{initials(request.employeeId?.name || '?')}</span><span><strong>{request.employeeId?.name || 'Unknown employee'}</strong><small>{request.type} · {new Date(request.startDate).toLocaleDateString()}</small></span><span className="pending-tag">Pending</span></div>)}{!pendingDashboardRequests.length && <p className="no-pending">No pending requests. You’re all caught up.</p>}</div></div></section><section className="module-card overview-departments"><div className="module-header compact"><div><div className="eyebrow">TEAM STRUCTURE</div><h2>People by department</h2></div><button className="text-button" onClick={() => setActiveModule('departments')}>View teams →</button></div>{departmentOptions.length ? departmentOptions.slice(0, 6).map((name) => { const count = employees.filter((employee) => employee.department === name).length; const percent = employees.length ? Math.max(3, Math.round(count / employees.length * 100)) : 0; return <button className="department-bar-row" key={name} onClick={() => goToDirectory(name)}><span>{name}</span><span className="department-bar-track"><i style={{ width: `${percent}%` }} /></span><strong>{count}</strong></button>; }) : <div className="module-empty">Add employees to see team distribution.</div>}</section><section className="module-card recent-team"><div className="module-header compact"><div><div className="eyebrow">RECENT CHANGES</div><h2>Recently updated records</h2></div><button className="text-button" onClick={() => setActiveModule('employees')}>View directory →</button></div>{[...employees].sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)).slice(0, 5).map((employee, index) => <button className="recent-employee" key={employee._id} onClick={() => { setActiveModule('employees'); setViewEmployee(employee); }}><div className={`employee-avatar ${colors[index % colors.length]}`}>{initials(employee.name)}</div><span><strong>{employee.name}</strong><small>{employee.role} · Updated {new Date(employee.updatedAt || employee.createdAt).toLocaleDateString()}</small></span><span className={`status-pill ${(employee.status || 'Active').toLowerCase().replace(' ', '-')}`}>{employee.status || 'Active'}</span></button>)}{!employees.length && <div className="module-empty compact-empty">No employee changes yet. Add your first teammate to get started.</div>}</section><section className="module-card overview-shortcuts"><div className="eyebrow">PEOPLE OPERATIONS</div><h2>Management modules</h2><p>Choose a module to handle a different part of the employee lifecycle.</p><div className="module-shortcuts">{!isEmployee && <button onClick={() => setActiveModule('departments')}><Building2 size={18} /><strong>Departments</strong><small>Team structure and headcount</small></button>}<button onClick={() => setActiveModule('attendance')}><ClipboardCheck size={18} /><strong>Attendance</strong><small>Daily team attendance register</small></button><button onClick={() => setActiveModule('leave')}><Plane size={18} /><strong>Leave requests</strong><small>Review and approve time off</small></button>{canManageWorkforce && <button onClick={() => setActiveModule('reports')}><ChartNoAxesCombined size={18} /><strong>Reports</strong><small>Export employee data</small></button>}</div></section></div></>}

        {/* Website: People → Employee directory table, filters, and row actions. */}
        {activeModule === 'employees' && <div className="directory-card" id="employee-directory">
          <div className="directory-heading"><div><h2>All employees</h2><p>Manage your team members and their details.</p></div><span className="updated-note"><span className="status-dot" /> Live directory</span></div>
          <div className="toolbar"><label className="search-box"><Search size={16} /><input value={query} onChange={(event) => { setQuery(event.target.value); setCurrentPage(1); }} placeholder="Search name, email, role..." /></label><label className="select-wrap"><select value={department} onChange={(event) => { setDepartment(event.target.value); setCurrentPage(1); }}><option>All departments</option>{departmentOptions.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} /></label><label className="select-wrap"><select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setCurrentPage(1); }}><option>All statuses</option><option>Active</option><option>On Leave</option><option>Inactive</option></select><ChevronDown size={15} /></label><label className="select-wrap sort-select"><select value={sortOrder} onChange={(event) => { setSortOrder(event.target.value); setCurrentPage(1); }}><option>Newest first</option><option>Oldest first</option><option>Name A–Z</option><option>Name Z–A</option></select><ArrowUpDown size={14} /></label></div>

          {error && !modalOpen && <div className="error-banner">{error}<button onClick={loadEmployees}>Retry</button></div>}
          <div className="table-wrap"><table><thead><tr><th>EMPLOYEE</th><th>DEPARTMENT</th><th>ROLE</th><th>STATUS</th><th>LOCATION</th><th>EMAIL</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
            {loading ? <tr><td colSpan="7" className="empty-state"><div className="spinner" />Loading employees…</td></tr> : pageEmployees.length ? pageEmployees.map((employee, index) => <tr key={employee._id}><td><div className="employee-cell"><div className={`employee-avatar ${colors[index % colors.length]}`}>{initials(employee.name)}</div><div><button className="employee-name" onClick={() => setViewEmployee(employee)}>{employee.name}</button><small>{employee.employmentType || 'Full-time'}</small></div></div></td><td><button className="department-pill dept-link" onClick={() => goToDirectory(employee.department)}>{employee.department}</button></td><td className="role-cell">{employee.role}</td><td><span className={`status-pill ${(employee.status || 'Active').toLowerCase().replace(' ', '-')}`}>{employee.status || 'Active'}</span></td><td className="email-cell">{employee.location || '—'}</td><td className="email-cell">{employee.email}</td><td><div className="row-menu-wrap"><button className="row-menu-trigger" aria-label={`Actions for ${employee.name}`} aria-expanded={openRowMenu === employee._id} title="Employee actions" onClick={() => setOpenRowMenu((id) => id === employee._id ? null : employee._id)}><MoreHorizontal size={18} /></button>{openRowMenu === employee._id && <div className="dropdown-menu row-dropdown"><button onClick={() => { setOpenRowMenu(null); setViewEmployee(employee); }}><UserRound size={14} />View profile</button>{isAdmin && <><button onClick={() => { setOpenRowMenu(null); openEdit(employee); }}><Pencil size={14} />Edit details</button>{employee.status !== 'Active' && <button onClick={() => { setOpenRowMenu(null); changeStatus(employee, 'Active'); }}><UserCheck size={14} />Mark active</button>}{employee.status !== 'On Leave' && <button onClick={() => { setOpenRowMenu(null); changeStatus(employee, 'On Leave'); }}><Clock3 size={14} />Mark on leave</button>}{employee.status !== 'Inactive' && <button onClick={() => { setOpenRowMenu(null); changeStatus(employee, 'Inactive'); }}><UserX size={14} />Mark inactive</button>}<button className="danger-menu-item" onClick={() => { setOpenRowMenu(null); deleteEmployee(employee); }}><Trash2 size={14} />Delete permanently</button></>}</div>}</div></td></tr>) : <tr><td colSpan="7" className="empty-state"><div className="empty-icon"><UserRound size={20} /></div><strong>{employees.length ? 'No employees found' : (isEmployee ? 'No profile linked to this account' : 'Your team starts here')}</strong><span>{employees.length ? 'Try another search or department.' : (isEmployee ? 'Ask an Admin to add an employee profile using your sign-in email.' : 'Add your first employee to start building your directory.')}</span>{!employees.length && isAdmin && <button className="text-button" onClick={openCreate}><UserPlus size={15} /> Add your first employee</button>}</td></tr>}
          </tbody></table></div>
          <div className="table-footer"><span>Showing <strong>{visibleEmployees.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, visibleEmployees.length)}</strong> of <strong>{visibleEmployees.length}</strong> matching ({employees.length} total)</span><div className="pagination"><button disabled={currentPage <= 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>Previous</button><span>Page {currentPage} of {pageCount}</span><button disabled={currentPage >= pageCount} onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}>Next</button></div></div>
        </div>}
        {activeModule === 'departments' && !isEmployee && <DepartmentModule departments={departmentRecords} employees={employees} onReload={loadDepartments} onSelectDepartment={goToDirectory} canManage={isAdmin} />}
        {activeModule === 'attendance' && <AttendanceModule employees={isEmployee ? employees : employees.filter((employee) => (employee.status || 'Active') !== 'Inactive')} role={user.role} />}
        {activeModule === 'leave' && <LeaveModule employees={isEmployee ? employees : employees.filter((employee) => (employee.status || 'Active') !== 'Inactive')} role={user.role} />}
        {activeModule === 'access' && isAdmin && <AccessModule user={user} />}
        {activeModule === 'reports' && canManageWorkforce && <div className="reports-layout"><section className="module-card reports-export"><div className="report-icon"><Download size={20} /></div><div className="eyebrow">DATA EXPORT</div><h2>Employee directory report</h2><p>Download a spreadsheet-friendly CSV with employee contact, role, team, employment, and status details.</p><button className="primary-button" onClick={exportCsv}><Download size={15} />Download employee CSV</button></section><section className="module-card reports-summary"><div className="eyebrow">WORKFORCE SNAPSHOT</div><h2>Team summary</h2><div className="report-stat-grid"><div><span>Active</span><strong>{activeCount}</strong></div><div><span>On leave</span><strong>{leaveCount}</strong></div><div><span>Inactive</span><strong>{employees.filter((employee) => employee.status === 'Inactive').length}</strong></div><div><span>Departments</span><strong>{departmentOptions.length}</strong></div></div><div className="report-department-list">{departmentOptions.map((name) => <div key={name}><span>{name}</span><strong>{employees.filter((employee) => employee.department === name).length}</strong></div>)}</div></section><section className="module-card soap-report"><div className="report-icon soap-icon"><FileCode2 size={20} /></div><div><div className="eyebrow">API LEARNING DEMO</div><h2>SOAP XML request</h2><p>Run a sample SOAP request against the employee service and display how many employee records it returns.</p></div><button className="secondary-button" onClick={testSoap}>Run SOAP demo</button></section></div>}
        <footer className="page-footer">PeopleDesk <span>·</span> Employee Management System</footer>
      </section>
    </main>

    {notice && <div className="toast"><span className="toast-check">✓</span>{notice}</div>}
    {modalOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}><section className="modal employee-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-top"><div className="modal-icon"><UserPlus size={19} /></div><button className="close-button" onClick={() => setModalOpen(false)} aria-label="Close"><X size={18} /></button></div><h2 id="modal-title">{editingId ? 'Edit employee' : 'Add a new employee'}</h2><p className="modal-subtitle">{editingId ? 'Update this team member’s information below.' : 'Add contact, role, and employment details.'}</p><form onSubmit={saveEmployee}><label>Full name<input required maxLength="80" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Jamie Chen" /></label><label>Email address<input required type="email" maxLength="120" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="jamie@company.com" /></label><div className="form-grid"><label>Department<select required value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })}><option value="" disabled>Select department</option>{departmentOptions.map((item) => <option key={item}>{item}</option>)}</select></label><label>Job title<input required maxLength="80" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} placeholder="e.g. Product Designer" /></label></div><div className="form-grid"><label>Phone<input maxLength="30" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="e.g. +1 555 0100" /></label><label>Work location<input maxLength="80" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="e.g. New York / Remote" /></label></div><div className="form-grid"><label>Employment type<select value={form.employmentType} onChange={(event) => setForm({ ...form, employmentType: event.target.value })}><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Intern</option></select></label><label>Employment status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option>Active</option><option>On Leave</option><option>Inactive</option></select></label></div><label>Start date<input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} /></label><label>Notes <span className="optional-label">(optional)</span><textarea maxLength="500" rows="3" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Internal notes about this employee…" /></label>{error && <div className="form-error">{error}</div>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="primary-button">{editingId ? 'Save changes' : 'Add employee'}</button></div></form></section></div>}
    {viewEmployee && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setViewEmployee(null); }}><section className="modal profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title"><div className="modal-top"><div className={`employee-avatar profile-avatar ${colors[employees.findIndex((item) => item._id === viewEmployee._id) % colors.length]}`}>{initials(viewEmployee.name)}</div><button className="close-button" onClick={() => setViewEmployee(null)} aria-label="Close"><X size={18} /></button></div><h2 id="profile-title">{viewEmployee.name}</h2><p className="modal-subtitle">{viewEmployee.role} · {viewEmployee.department}</p><div className="profile-status"><span className={`status-pill ${(viewEmployee.status || 'Active').toLowerCase().replace(' ', '-')}`}>{viewEmployee.status || 'Active'}</span><span>{viewEmployee.employmentType || 'Full-time'}</span></div><div className="profile-details"><div><Mail size={15} /><span>{viewEmployee.email}</span></div><div><Phone size={15} /><span>{viewEmployee.phone || 'No phone provided'}</span></div><div><MapPin size={15} /><span>{viewEmployee.location || 'No location provided'}</span></div><div><CalendarDays size={15} /><span>Started {viewEmployee.startDate ? new Date(viewEmployee.startDate).toLocaleDateString() : 'Date not set'}</span></div></div>{viewEmployee.notes && <div className="profile-notes"><strong>Notes</strong><p>{viewEmployee.notes}</p></div>}<div className="modal-actions"><button className="secondary-button" onClick={() => setViewEmployee(null)}>Close</button>{isAdmin && <button className="primary-button" onClick={() => { setViewEmployee(null); openEdit(viewEmployee); }}><Pencil size={15} /> Edit profile</button>}</div></section></div>}
  </div>;
}

export default function App() {
  const [session, setSession] = useState(() => {
    const token = localStorage.getItem('peopleDeskToken');
    try { return token ? { token, user: JSON.parse(localStorage.getItem('peopleDeskUser') || 'null') } : null; }
    catch { return null; }
  });

  useEffect(() => {
    if (!session?.token) return;
    let current = true;
    api.get('/auth/me').then(({ data }) => {
      if (!current) return;
      localStorage.setItem('peopleDeskToken', data.token);
      localStorage.setItem('peopleDeskUser', JSON.stringify(data.user));
      setSession(data);
    }).catch(() => {
      if (!current) return;
      localStorage.removeItem('peopleDeskToken'); localStorage.removeItem('peopleDeskUser'); setSession(null);
    });
    return () => { current = false; };
  }, [session?.token, session?.user?.role]);

  function signIn(data) {
    localStorage.setItem('peopleDeskToken', data.token);
    localStorage.setItem('peopleDeskUser', JSON.stringify(data.user));
    setSession(data);
  }
  function signOut() {
    localStorage.removeItem('peopleDeskToken'); localStorage.removeItem('peopleDeskUser'); setSession(null);
  }

  return session?.token && session.user
    ? <EmployeeDashboard user={session.user} onLogout={signOut} />
    : <AuthScreen onAuthenticated={signIn} />;
}
