import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function Auth({ mode }) {
  const isSignup = mode === 'signup';
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [error, setError] = useState('');
  const { saveSession } = useAuth();
  const navigate = useNavigate();
  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post(isSignup ? '/auth/register' : '/auth/login', form);
      saveSession(data);
      navigate('/');
    } catch (err) { setError(errMsg(err)); }
  };

  return (
    <form className="card narrow" onSubmit={submit}>
      <h1>{isSignup ? 'Create your account' : 'Welcome back'}</h1>
      {error && <p className="alert error">{error}</p>}
      {isSignup && <label>Full name<input name="name" value={form.name} onChange={set} required /></label>}
      <label>Email<input type="email" name="email" value={form.email} onChange={set} required /></label>
      <label>Password<input type="password" name="password" value={form.password} onChange={set} minLength={6} required /></label>
      {isSignup && (
        <label>I am a
          <select name="role" value={form.role} onChange={set}>
            <option value="student">Student</option>
            <option value="organizer">Organizer</option>
          </select>
        </label>
      )}
      <button className="btn">{isSignup ? 'Sign up' : 'Log in'}</button>
      <p className="muted">
        {isSignup ? <>Already have an account? <Link to="/login">Log in</Link></> : <>New here? <Link to="/signup">Create an account</Link></>}
      </p>
    </form>
  );
}
