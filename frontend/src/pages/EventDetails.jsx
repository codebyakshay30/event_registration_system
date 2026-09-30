import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { fmtDate, SeatBar } from './Dashboard.jsx';

export default function EventDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [registered, setRegistered] = useState(false);
  const [form, setForm] = useState({ phone: '', department: '', year: 1 });
  const [msg, setMsg] = useState({ type: '', text: '' });

  const isOwner = user.role === 'organizer' && event?.organizer?._id === user.id;

  const load = async () => {
    try {
      const { data } = await api.get(`/events/${id}`);
      setEvent(data);
      if (user.role === 'student') {
        const mine = await api.get('/events/registrations/mine');
        setRegistered(mine.data.some((r) => r.event?._id === id));
      } else if (data.organizer._id === user.id) {
        setParticipants((await api.get(`/events/${id}/participants`)).data.participants);
      }
    } catch (e) { setMsg({ type: 'error', text: errMsg(e) }); }
  };
  useEffect(() => { load(); }, [id]);

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const register = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/events/${id}/register`, { ...form, year: Number(form.year) });
      setMsg({ type: 'success', text: 'You are registered for this event.' });
      load();
    } catch (err) { setMsg({ type: 'error', text: errMsg(err) }); load(); }
  };

  const cancel = async () => {
    try { await api.delete(`/events/${id}/register`); setMsg({ type: 'success', text: 'Registration cancelled.' }); load(); }
    catch (err) { setMsg({ type: 'error', text: errMsg(err) }); }
  };

  if (!event) return <p className="muted">{msg.text || 'Loading...'}</p>;

  return (
    <>
      <Link to="/" className="muted">Back to events</Link>
      <div className="card">
        <div className="row between">
          <h1>{event.title}</h1>
          <span className={`badge ${event.isFull ? 'full' : 'open'}`}>{event.isFull ? 'Registration closed' : `${event.seatsLeft} seats left`}</span>
        </div>
        <p className="muted">{fmtDate(event.date)} at {event.venue} | Organized by {event.organizer?.name}</p>
        {event.description && <p>{event.description}</p>}
        <SeatBar event={event} />
      </div>

      {msg.text && <p className={`alert ${msg.type}`}>{msg.text}</p>}

      {user.role === 'student' && (registered ? (
        <div className="card row between">
          <strong>You are registered for this event.</strong>
          <button className="btn danger small" onClick={cancel}>Cancel registration</button>
        </div>
      ) : event.isFull ? (
        <p className="alert error">This event has reached its maximum capacity. Registration is closed.</p>
      ) : (
        <form className="card narrow" onSubmit={register}>
          <h2>Register for this event</h2>
          <label>Phone number<input name="phone" value={form.phone} onChange={set} pattern="[0-9]{10}" title="10 digit phone number" required /></label>
          <label>Department<input name="department" value={form.department} onChange={set} required /></label>
          <label>Year
            <select name="year" value={form.year} onChange={set}>{[1, 2, 3, 4].map((y) => <option key={y} value={y}>{y}</option>)}</select>
          </label>
          <button className="btn">Register</button>
        </form>
      ))}

      {isOwner && (
        <div className="card">
          <h2>Registered participants ({participants.length})</h2>
          {participants.length === 0 ? <p className="muted">No one has registered yet.</p> : (
            <div className="scroll">
              <table>
                <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Department</th><th>Year</th></tr></thead>
                <tbody>
                  {participants.map((p, i) => (
                    <tr key={p._id}><td>{i + 1}</td><td>{p.student?.name}</td><td>{p.student?.email}</td><td>{p.phone}</td><td>{p.department}</td><td>{p.year}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}
