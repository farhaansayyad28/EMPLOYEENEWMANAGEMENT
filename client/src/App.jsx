import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Users, UserPlus, Search, Pencil, Trash2, X, Building2, UserRound, ChevronDown, MoreHorizontal, Download, FileCode2, Phone, MapPin, CalendarDays, ArrowUpDown, Mail, Clock3, UserCheck, UserX } from 'lucide-react';
import AuthScreen from './AuthScreen.jsx';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('peopleDeskToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
const blank = { name: '', email: '', department: '', role: '', phone: '', location: '', employmentType: 'Full-time', status: 'Active', startDate: new Date().toISOString().slice(0, 10), notes: '' };
const departments = ['Engineering', 'Design', 'Marketing', 'Human Resources', 'Finance', 'Operations', 'Sales'];
const colors = ['violet', 'blue', 'amber', 'rose', 'teal', 'orange'];
const initials = (name) => name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

function SummaryCard({ icon: Icon, tone, label, value }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={18} /></div><div><span>{label}</span><strong>{value}</strong></div></div>;
}

function EmployeeDashboard({ user, onLogout }) {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('All departments');
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [employeesExpanded, setEmployeesExpanded] = useState(true);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [openRowMenu, setOpenRowMenu] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [sortOrder, setSortOrder] = useState('Newest first');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewEmployee, setViewEmployee] = useState(null);
  const pageSize = 8;

  async function exportCsv() {
    try {
      const response = await api.get('/employees/export/csv', { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a'); link.href = url; link.download = 'employees.csv'; link.click(); URL.revokeObjectURL(url);
      setNotice('Employee CSV downloaded. A copy was also saved on the server.');
    } catch (requestError) { setError(requestError.response?.data?.message || 'Could not export employees.'); }
    window.setTimeout(() => setNotice(''), 3000);
  }

  async function testSoap() {
    const envelope = '<?xml version="1.0"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetEmployees /></soap:Body></soap:Envelope>';
    try {
      const response = await api.post('/soap', envelope, { headers: { 'Content-Type': 'text/xml' }, responseType: 'text' });
      const count = (response.data.match(/<Employee>/g) || []).length;
      setNotice(`SOAP XML request succeeded. ${count} employee record(s) returned.`);
    } catch (requestError) { setError(requestError.response?.data?.message || 'SOAP request failed.'); }
    window.setTimeout(() => setNotice(''), 3000);
  }

  async function loadEmployees() {
    setLoading(true);
    try { setEmployees((await api.get('/employees')).data); setError(''); }
    catch { setError('Could not connect to the API. Start the backend and check your MongoDB connection.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadEmployees(); }, []);

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
  const activeCount = employees.filter((employee) => (employee.status || 'Active') === 'Active').length;
  const leaveCount = employees.filter((employee) => employee.status === 'On Leave').length;
  const thisMonthHires = employees.filter((employee) => { const date = new Date(employee.startDate || employee.createdAt); const now = new Date(); return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear(); }).length;
  function goToDirectory(nextDepartment = 'All departments') {
    setDepartment(nextDepartment);
    setStatusFilter('All statuses');
    setQuery('');
    setCurrentPage(1);
    document.getElementById('employee-directory')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark"><Users size={19} strokeWidth={2.5} /></span><span>people<span className="brand-light">desk</span></span></div>
      <div className="workspace-label">WORKSPACE</div>
      <button className={`nav-item ${employeesExpanded ? 'active' : ''}`} onClick={() => setEmployeesExpanded((expanded) => !expanded)} aria-expanded={employeesExpanded} aria-controls="employee-submenu"><Users size={17} /> <span>Employees</span><span className="nav-count">{employees.length}</span><ChevronDown size={14} className={`nav-chevron ${employeesExpanded ? 'expanded' : ''}`} /></button>
      {employeesExpanded && <div className="nav-submenu" id="employee-submenu">
        <button className="nav-subitem selected" onClick={() => goToDirectory()}><span className="submenu-dot" />Employee directory</button>
        <button className="nav-subitem" onClick={openCreate}><UserPlus size={14} />Add employee</button>
        {departmentsInUse.length > 0 && <><div className="submenu-heading">DEPARTMENTS</div>{departmentsInUse.map((item) => <button className="nav-subitem department-nav" key={item} onClick={() => goToDirectory(item)}><span className="submenu-dot" />{item}<span className="submenu-count">{employees.filter((employee) => employee.department === item).length}</span></button>)}</>}
      </div>}
      <div className="sidebar-bottom"><div className="workspace-label">YOUR WORKSPACE</div><div className="workspace-card"><div className="workspace-avatar">AC</div><div><strong>Acme Creative</strong><small>Free workspace</small></div><ChevronDown size={15} className="workspace-chevron" /></div></div>
    </aside>

    <main className="main-content">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>Employees</strong></div><div className="topbar-right"><span className="today-label">{user.name}</span><button className="signout-button" onClick={onLogout}>Sign out</button><div className="user-avatar">{initials(user.name)}</div></div></header>
      <section className="page-content">
        <div className="heading-row"><div><div className="eyebrow">PEOPLE &amp; CULTURE</div><h1>Employees <span className="title-count">{employees.length}</span></h1><p className="subtitle">A simple overview of everyone on your team.</p></div><div className="heading-actions"><div className="dropdown-anchor"><button className="secondary-button feature-button" aria-expanded={actionsOpen} onClick={() => setActionsOpen((open) => !open)}>Employee actions <ChevronDown size={14} className={actionsOpen ? 'expanded' : ''} /></button>{actionsOpen && <div className="dropdown-menu"><button onClick={() => { setActionsOpen(false); openCreate(); }}><UserPlus size={15} />Add employee</button><button onClick={() => { setActionsOpen(false); exportCsv(); }}><Download size={15} />Export CSV</button><button onClick={() => { setActionsOpen(false); testSoap(); }}><FileCode2 size={15} />SOAP XML demo</button></div>}</div><button className="primary-button" onClick={openCreate}><UserPlus size={17} /> Add employee</button></div></div>

        <div className="stats-row">
          <SummaryCard icon={Users} tone="purple" label="Total employees" value={employees.length} />
          <SummaryCard icon={UserCheck} tone="green" label="Active employees" value={activeCount} />
          <SummaryCard icon={Clock3} tone="orange" label="On leave" value={leaveCount} />
          <SummaryCard icon={CalendarDays} tone="blue" label="Joined this month" value={thisMonthHires} />
        </div>

        <div className="directory-card" id="employee-directory">
          <div className="directory-heading"><div><h2>All employees</h2><p>Manage your team members and their details.</p></div><span className="updated-note"><span className="status-dot" /> Live directory</span></div>
          <div className="toolbar"><label className="search-box"><Search size={16} /><input value={query} onChange={(event) => { setQuery(event.target.value); setCurrentPage(1); }} placeholder="Search name, email, role..." /></label><label className="select-wrap"><select value={department} onChange={(event) => { setDepartment(event.target.value); setCurrentPage(1); }}><option>All departments</option>{departmentsInUse.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} /></label><label className="select-wrap"><select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setCurrentPage(1); }}><option>All statuses</option><option>Active</option><option>On Leave</option><option>Inactive</option></select><ChevronDown size={15} /></label><label className="select-wrap sort-select"><select value={sortOrder} onChange={(event) => { setSortOrder(event.target.value); setCurrentPage(1); }}><option>Newest first</option><option>Oldest first</option><option>Name A–Z</option><option>Name Z–A</option></select><ArrowUpDown size={14} /></label></div>

          {error && !modalOpen && <div className="error-banner">{error}<button onClick={loadEmployees}>Retry</button></div>}
          <div className="table-wrap"><table><thead><tr><th>EMPLOYEE</th><th>DEPARTMENT</th><th>ROLE</th><th>STATUS</th><th>LOCATION</th><th>EMAIL</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
            {loading ? <tr><td colSpan="7" className="empty-state"><div className="spinner" />Loading employees…</td></tr> : pageEmployees.length ? pageEmployees.map((employee, index) => <tr key={employee._id}><td><div className="employee-cell"><div className={`employee-avatar ${colors[index % colors.length]}`}>{initials(employee.name)}</div><div><button className="employee-name" onClick={() => setViewEmployee(employee)}>{employee.name}</button><small>{employee.employmentType || 'Full-time'}</small></div></div></td><td><button className="department-pill dept-link" onClick={() => goToDirectory(employee.department)}>{employee.department}</button></td><td className="role-cell">{employee.role}</td><td><span className={`status-pill ${(employee.status || 'Active').toLowerCase().replace(' ', '-')}`}>{employee.status || 'Active'}</span></td><td className="email-cell">{employee.location || '—'}</td><td className="email-cell">{employee.email}</td><td><div className="row-menu-wrap"><button className="row-menu-trigger" aria-label={`Actions for ${employee.name}`} aria-expanded={openRowMenu === employee._id} title="Employee actions" onClick={() => setOpenRowMenu((id) => id === employee._id ? null : employee._id)}><MoreHorizontal size={18} /></button>{openRowMenu === employee._id && <div className="dropdown-menu row-dropdown"><button onClick={() => { setOpenRowMenu(null); setViewEmployee(employee); }}><UserRound size={14} />View profile</button><button onClick={() => { setOpenRowMenu(null); openEdit(employee); }}><Pencil size={14} />Edit details</button>{employee.status !== 'Active' && <button onClick={() => { setOpenRowMenu(null); changeStatus(employee, 'Active'); }}><UserCheck size={14} />Mark active</button>}{employee.status !== 'On Leave' && <button onClick={() => { setOpenRowMenu(null); changeStatus(employee, 'On Leave'); }}><Clock3 size={14} />Mark on leave</button>}{employee.status !== 'Inactive' && <button onClick={() => { setOpenRowMenu(null); changeStatus(employee, 'Inactive'); }}><UserX size={14} />Mark inactive</button>}<button className="danger-menu-item" onClick={() => { setOpenRowMenu(null); deleteEmployee(employee); }}><Trash2 size={14} />Delete permanently</button></div>}</div></td></tr>) : <tr><td colSpan="7" className="empty-state"><div className="empty-icon"><UserRound size={20} /></div><strong>{employees.length ? 'No employees found' : 'Your team starts here'}</strong><span>{employees.length ? 'Try another search or department.' : 'Add your first employee to start building your directory.'}</span>{!employees.length && <button className="text-button" onClick={openCreate}><UserPlus size={15} /> Add your first employee</button>}</td></tr>}
          </tbody></table></div>
          <div className="table-footer"><span>Showing <strong>{visibleEmployees.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, visibleEmployees.length)}</strong> of <strong>{visibleEmployees.length}</strong> matching ({employees.length} total)</span><div className="pagination"><button disabled={currentPage <= 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>Previous</button><span>Page {currentPage} of {pageCount}</span><button disabled={currentPage >= pageCount} onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}>Next</button></div></div>
        </div>
        <footer className="page-footer">PeopleDesk <span>·</span> Employee Management System</footer>
      </section>
    </main>

    {notice && <div className="toast"><span className="toast-check">✓</span>{notice}</div>}
    {modalOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}><section className="modal employee-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-top"><div className="modal-icon"><UserPlus size={19} /></div><button className="close-button" onClick={() => setModalOpen(false)} aria-label="Close"><X size={18} /></button></div><h2 id="modal-title">{editingId ? 'Edit employee' : 'Add a new employee'}</h2><p className="modal-subtitle">{editingId ? 'Update this team member’s information below.' : 'Add contact, role, and employment details.'}</p><form onSubmit={saveEmployee}><label>Full name<input required maxLength="80" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Jamie Chen" /></label><label>Email address<input required type="email" maxLength="120" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="jamie@company.com" /></label><div className="form-grid"><label>Department<select required value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })}><option value="" disabled>Select department</option>{departments.map((item) => <option key={item}>{item}</option>)}{form.department && !departments.includes(form.department) && <option>{form.department}</option>}</select></label><label>Job title<input required maxLength="80" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} placeholder="e.g. Product Designer" /></label></div><div className="form-grid"><label>Phone<input maxLength="30" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="e.g. +1 555 0100" /></label><label>Work location<input maxLength="80" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="e.g. New York / Remote" /></label></div><div className="form-grid"><label>Employment type<select value={form.employmentType} onChange={(event) => setForm({ ...form, employmentType: event.target.value })}><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Intern</option></select></label><label>Employment status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option>Active</option><option>On Leave</option><option>Inactive</option></select></label></div><label>Start date<input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} /></label><label>Notes <span className="optional-label">(optional)</span><textarea maxLength="500" rows="3" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Internal notes about this employee…" /></label>{error && <div className="form-error">{error}</div>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="primary-button">{editingId ? 'Save changes' : 'Add employee'}</button></div></form></section></div>}
    {viewEmployee && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setViewEmployee(null); }}><section className="modal profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title"><div className="modal-top"><div className={`employee-avatar profile-avatar ${colors[employees.findIndex((item) => item._id === viewEmployee._id) % colors.length]}`}>{initials(viewEmployee.name)}</div><button className="close-button" onClick={() => setViewEmployee(null)} aria-label="Close"><X size={18} /></button></div><h2 id="profile-title">{viewEmployee.name}</h2><p className="modal-subtitle">{viewEmployee.role} · {viewEmployee.department}</p><div className="profile-status"><span className={`status-pill ${(viewEmployee.status || 'Active').toLowerCase().replace(' ', '-')}`}>{viewEmployee.status || 'Active'}</span><span>{viewEmployee.employmentType || 'Full-time'}</span></div><div className="profile-details"><div><Mail size={15} /><span>{viewEmployee.email}</span></div><div><Phone size={15} /><span>{viewEmployee.phone || 'No phone provided'}</span></div><div><MapPin size={15} /><span>{viewEmployee.location || 'No location provided'}</span></div><div><CalendarDays size={15} /><span>Started {viewEmployee.startDate ? new Date(viewEmployee.startDate).toLocaleDateString() : 'Date not set'}</span></div></div>{viewEmployee.notes && <div className="profile-notes"><strong>Notes</strong><p>{viewEmployee.notes}</p></div>}<div className="modal-actions"><button className="secondary-button" onClick={() => setViewEmployee(null)}>Close</button><button className="primary-button" onClick={() => { setViewEmployee(null); openEdit(viewEmployee); }}><Pencil size={15} /> Edit profile</button></div></section></div>}
  </div>;
}

export default function App() {
  const [session, setSession] = useState(() => {
    const token = localStorage.getItem('peopleDeskToken');
    try { return token ? { token, user: JSON.parse(localStorage.getItem('peopleDeskUser') || 'null') } : null; }
    catch { return null; }
  });

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
