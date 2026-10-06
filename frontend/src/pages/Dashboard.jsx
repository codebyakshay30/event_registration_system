import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export const fmtDate = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
export const hasEnded = (ev) => new Date(ev.date) < new Date();

export function SeatBar({ event }) {
  const pct = Math.min(100, (event.registeredCount / event.maxCapacity) * 100);
  return (
    <div>
      <div className="bar"><div className={`fill ${event.isFull ? 'full' : ''}`} style={{ width: `${pct}%` }} /></div>
      <small className="muted">{event.registeredCount} of {event.maxCapacity} seats taken</small>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => api.get('/events').then((r) => setEvents(r.data)).catch((e) => setError(errMsg(e))).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm('Delete this event and all its registrations?')) return;
    try { await api.delete(`/events/${id}`); load(); } catch (e) { setError(errMsg(e)); }
  };

  const shown = events
    .filter((e) => e.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => Number(hasEnded(a)) - Number(hasEnded(b)));

  return (
    <>
      <div className="row between">
        <h1>{user.role === 'organizer' ? 'Manage events' : 'Upcoming events'}</h1>
        {user.role === 'organizer' && <Link className="btn" to="/events/new">Create event</Link>}
      </div>
      <input className="search" placeholder="Search events by title" value={search} onChange={(e) => setSearch(e.target.value)} />
      {error && <p className="alert error">{error}</p>}
      {loading && <p className="muted">Loading events...</p>}
      {!loading && shown.length === 0 && <p className="muted">No events found{user.role === 'organizer' ? '. Create your first event.' : '.'}</p>}
      <div className="grid">
        {shown.map((ev) => {
          const mine = ev.organizer?._id === user.id;
          return (
            <article className="card" key={ev._id}>
              <div className="row between">
                <h2>{ev.title}</h2>
                <span className={`badge ${hasEnded(ev) ? 'ended' : ev.isFull ? 'full' : 'open'}`}>
                  {hasEnded(ev) ? 'Ended' : ev.isFull ? 'Full' : 'Open'}
                </span>
              </div>
              <p className="muted">{fmtDate(ev.date)} at {ev.venue}</p>
              <SeatBar event={ev} />
              <div className="row gap">
                <Link className="btn small" to={`/events/${ev._id}`}>{user.role === 'organizer' && mine ? 'Participants' : 'Details'}</Link>
                {user.role === 'organizer' && mine && (
                  <>
                    <Link className="btn small ghost" to={`/events/${ev._id}/edit`}>Edit</Link>
                    <button className="btn small danger" onClick={() => remove(ev._id)}>Delete</button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
