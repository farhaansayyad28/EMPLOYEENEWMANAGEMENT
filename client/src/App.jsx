import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Users, UserPlus, Search, Pencil, Trash2, X, BriefcaseBusiness, Building2, UserRound, ChevronDown } from 'lucide-react';
import AuthScreen from './AuthScreen.jsx';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('peopleDeskToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
const blank = { name: '', email: '', department: '', role: '' };
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
    return text.includes(query.toLowerCase()) && (department === 'All departments' || employee.department === department);
  }), [employees, query, department]);

  function openCreate() { setEditingId(null); setForm(blank); setError(''); setModalOpen(true); }
  function openEdit(employee) {
    setEditingId(employee._id);
    setForm({ name: employee.name, email: employee.email, department: employee.department, role: employee.role });
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

  const departmentsInUse = [...new Set(employees.map((employee) => employee.department))];

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark"><Users size={19} strokeWidth={2.5} /></span><span>people<span className="brand-light">desk</span></span></div>
      <div className="workspace-label">WORKSPACE</div>
      <button className="nav-item active"><Users size={17} /> <span>Employees</span><span className="nav-count">{employees.length}</span></button>
      <div className="sidebar-bottom"><div className="workspace-label">YOUR WORKSPACE</div><div className="workspace-card"><div className="workspace-avatar">AC</div><div><strong>Acme Creative</strong><small>Free workspace</small></div><ChevronDown size={15} className="workspace-chevron" /></div></div>
    </aside>

    <main className="main-content">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>Employees</strong></div><div className="topbar-right"><span className="today-label">{user.name}</span><button className="signout-button" onClick={onLogout}>Sign out</button><div className="user-avatar">{initials(user.name)}</div></div></header>
      <section className="page-content">
        <div className="heading-row"><div><div className="eyebrow">PEOPLE &amp; CULTURE</div><h1>Employees <span className="title-count">{employees.length}</span></h1><p className="subtitle">A simple overview of everyone on your team.</p></div><div className="heading-actions"><button className="secondary-button feature-button" onClick={exportCsv}>Export CSV</button><button className="secondary-button feature-button" onClick={testSoap}>SOAP demo</button><button className="primary-button" onClick={openCreate}><UserPlus size={17} /> Add employee</button></div></div>

        <div className="stats-row">
          <SummaryCard icon={Users} tone="purple" label="Total employees" value={employees.length} />
          <SummaryCard icon={Building2} tone="green" label="Departments" value={departmentsInUse.length} />
          <SummaryCard icon={BriefcaseBusiness} tone="orange" label="Roles filled" value={new Set(employees.map((employee) => employee.role.toLowerCase())).size} />
        </div>

        <div className="directory-card">
          <div className="directory-heading"><div><h2>All employees</h2><p>Manage your team members and their details.</p></div><span className="updated-note"><span className="status-dot" /> Live directory</span></div>
          <div className="toolbar"><label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, role, or email..." /></label><label className="select-wrap"><select value={department} onChange={(event) => setDepartment(event.target.value)}><option>All departments</option>{departmentsInUse.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} /></label></div>

          {error && !modalOpen && <div className="error-banner">{error}<button onClick={loadEmployees}>Retry</button></div>}
          <div className="table-wrap"><table><thead><tr><th>EMPLOYEE</th><th>DEPARTMENT</th><th>ROLE</th><th>EMAIL</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
            {loading ? <tr><td colSpan="5" className="empty-state"><div className="spinner" />Loading employees…</td></tr> : visibleEmployees.length ? visibleEmployees.map((employee, index) => <tr key={employee._id}><td><div className="employee-cell"><div className={`employee-avatar ${colors[index % colors.length]}`}>{initials(employee.name)}</div><div><strong>{employee.name}</strong><small>Team member</small></div></div></td><td><span className="department-pill">{employee.department}</span></td><td className="role-cell">{employee.role}</td><td className="email-cell">{employee.email}</td><td><div className="row-actions"><button aria-label={`Edit ${employee.name}`} title="Edit" onClick={() => openEdit(employee)}><Pencil size={15} /></button><button className="delete-action" aria-label={`Delete ${employee.name}`} title="Delete" onClick={() => deleteEmployee(employee)}><Trash2 size={15} /></button></div></td></tr>) : <tr><td colSpan="5" className="empty-state"><div className="empty-icon"><UserRound size={20} /></div><strong>{employees.length ? 'No employees found' : 'Your team starts here'}</strong><span>{employees.length ? 'Try another search or department.' : 'Add your first employee to start building your directory.'}</span>{!employees.length && <button className="text-button" onClick={openCreate}><UserPlus size={15} /> Add your first employee</button>}</td></tr>}
          </tbody></table></div>
          <div className="table-footer"><span>Showing <strong>{visibleEmployees.length}</strong> of <strong>{employees.length}</strong> employees</span><span className="footer-mark"><span /> People deserve great tools.</span></div>
        </div>
        <footer className="page-footer">PeopleDesk <span>·</span> Employee Management System</footer>
      </section>
    </main>

    {notice && <div className="toast"><span className="toast-check">✓</span>{notice}</div>}
    {modalOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-top"><div className="modal-icon"><UserPlus size={19} /></div><button className="close-button" onClick={() => setModalOpen(false)} aria-label="Close"><X size={18} /></button></div><h2 id="modal-title">{editingId ? 'Edit employee' : 'Add a new employee'}</h2><p className="modal-subtitle">{editingId ? 'Update this team member’s information below.' : 'Fill in the details to add someone to your team.'}</p><form onSubmit={saveEmployee}><label>Full name<input required maxLength="80" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Jamie Chen" /></label><label>Email address<input required type="email" maxLength="120" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="jamie@company.com" /></label><div className="form-grid"><label>Department<select required value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })}><option value="" disabled>Select department</option>{departments.map((item) => <option key={item}>{item}</option>)}{form.department && !departments.includes(form.department) && <option>{form.department}</option>}</select></label><label>Job title<input required maxLength="80" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} placeholder="e.g. Product Designer" /></label></div>{error && <div className="form-error">{error}</div>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="primary-button">{editingId ? 'Save changes' : 'Add employee'}</button></div></form></section></div>}
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
