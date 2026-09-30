import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import Auth from './pages/Auth.jsx';
import Dashboard from './pages/Dashboard.jsx';
import EventForm from './pages/EventForm.jsx';
import EventDetails from './pages/EventDetails.jsx';

// Route guard: redirects to login if not logged in, or home if role is wrong
function Guard({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
}

export default function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <>
      <header className="nav">
        <Link to="/" className="brand">Campus Events</Link>
        {user && (
          <div className="nav-right">
            <span>{user.name} <em className={`role ${user.role}`}>{user.role}</em></span>
            <button className="btn ghost" onClick={() => { logout(); navigate('/login'); }}>Log out</button>
          </div>
        )}
      </header>
      <main className="container">
        <Routes>
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/signup" element={<Auth mode="signup" />} />
          <Route path="/" element={<Guard><Dashboard /></Guard>} />
          <Route path="/events/new" element={<Guard role="organizer"><EventForm /></Guard>} />
          <Route path="/events/:id/edit" element={<Guard role="organizer"><EventForm /></Guard>} />
          <Route path="/events/:id" element={<Guard><EventDetails /></Guard>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </>
  );
}
