import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { errMsg } from '../api.js';

const toLocalInput = (d) => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 16); };

// One form used for both "Add" and "Update"
export default function EventForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', venue: '', date: '', maxCapacity: 50 });
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) api.get(`/events/${id}`).then(({ data }) => setForm({ ...data, date: toLocalInput(data.date) })).catch((e) => setError(errMsg(e)));
  }, [id]);

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const body = { title: form.title, description: form.description, venue: form.venue, date: form.date, maxCapacity: Number(form.maxCapacity) };
    try {
      if (id) await api.put(`/events/${id}`, body); else await api.post('/events', body);
      navigate('/');
    } catch (err) { setError(errMsg(err)); }
  };

  return (
    <form className="card narrow" onSubmit={submit}>
      <h1>{id ? 'Update event' : 'Create event'}</h1>
      {error && <p className="alert error">{error}</p>}
      <label>Title<input name="title" value={form.title} onChange={set} required minLength={3} /></label>
      <label>Description<textarea name="description" rows="3" value={form.description} onChange={set} /></label>
      <label>Venue<input name="venue" value={form.venue} onChange={set} required /></label>
      <label>Date and time<input type="datetime-local" name="date" value={form.date} onChange={set} required /></label>
      <label>Maximum participants<input type="number" name="maxCapacity" min="1" value={form.maxCapacity} onChange={set} required /></label>
      <div className="row gap">
        <button className="btn">{id ? 'Save changes' : 'Create event'}</button>
        <button type="button" className="btn ghost" onClick={() => navigate('/')}>Cancel</button>
      </div>
    </form>
  );
}
