import React, { useState } from 'react';
import { LockKeyhole, Users } from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isRegistering = mode === 'register';

  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const { data } = await api.post(`/auth/${mode}`, form);
      onAuthenticated(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not connect to the server. Make sure the backend is running.');
    } finally { setBusy(false); }
  }

  return <main className="auth-page"><section className="auth-card"><div className="auth-brand"><span className="brand-mark"><Users size={19} strokeWidth={2.5} /></span><span>people<span className="brand-light">desk</span></span></div><div className="auth-icon"><LockKeyhole size={20} /></div><h1>{isRegistering ? 'Create your account' : 'Welcome back'}</h1><p className="auth-subtitle">{isRegistering ? 'Create an account to manage your employee directory.' : 'Sign in to continue to your employee directory.'}</p><form onSubmit={submit}>
    {isRegistering && <label>Your name<input required maxLength="80" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Jamie Chen" /></label>}
    <label>Email address<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@company.com" /></label>
    <label>Password<input required type="password" minLength="8" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={isRegistering ? 'At least 8 characters' : 'Your password'} /></label>
    {error && <div className="form-error">{error}</div>}
    <button className="primary-button auth-submit" disabled={busy}>{busy ? 'Please wait…' : isRegistering ? 'Create account' : 'Sign in'}</button>
  </form><p className="auth-switch">{isRegistering ? 'Already registered?' : 'New to PeopleDesk?'} <button onClick={() => { setMode(isRegistering ? 'login' : 'register'); setError(''); }}> {isRegistering ? 'Sign in' : 'Create an account'}</button></p><p className="auth-note">First account becomes Admin; new accounts start as Employees. Admin assigns Manager access.</p></section></main>;
}
