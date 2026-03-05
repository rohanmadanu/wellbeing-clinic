import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
function authHeaders() { return { headers: { Authorization: `Bearer ${localStorage.getItem('wb_token')}` } }; }

function canStart(date, time) {
  const [tp, pd] = time.split(' ');
  let [h, m] = tp.split(':').map(Number);
  if (pd === 'PM' && h !== 12) h += 12;
  if (pd === 'AM' && h === 12) h = 0;
  const apptTime = new Date(`${date}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`);
  const diff = apptTime - new Date();
  return diff <= 10 * 60 * 1000 && diff >= -40 * 60 * 1000;
}

export default function DoctorDashboard({ user, onLogout }) {
  const [appointments, setAppointments]   = useState([]);
  const [filter, setFilter]               = useState('all');
  const [loading, setLoading]             = useState(true);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleMsg, setGoogleMsg]         = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchAppointments();
    checkGoogleStatus();
    // Check if redirected back from Google OAuth
    const g = searchParams.get('google');
    if (g === 'connected') setGoogleMsg('success');
    if (g === 'error')     setGoogleMsg('error');
  }, []);

  async function checkGoogleStatus() {
    try {
      const { data } = await axios.get(`${API}/auth/google-status`, authHeaders());
      setGoogleConnected(data.connected);
    } catch {}
  }

  async function fetchAppointments() {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API}/appointments/doctor`, authHeaders());
      setAppointments(data);
    } catch {} finally { setLoading(false); }
  }

  async function connectGoogle() {
    try {
      const { data } = await axios.get((import.meta.env.VITE_API_BASE || 'http://localhost:5001') + '/auth/google', authHeaders());
      window.location.href = data.url;
    } catch { alert('Failed to start Google auth. Please try again.'); }
  }

  async function updateStatus(id, status) {
    try {
      const { data } = await axios.patch(`${API}/appointments/${id}`, { status }, authHeaders());
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, ...data } : a));
    } catch {}
  }

  function handleLogout() {
    localStorage.removeItem('wb_token'); localStorage.removeItem('wb_user');
    onLogout(); navigate('/');
  }

  const filtered = filter === 'all' ? appointments : appointments.filter(a => a.status === filter);
  const counts = {
    all: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  };

  const grouped = filtered.reduce((acc, a) => {
    if (!acc[a.date]) acc[a.date] = [];
    acc[a.date].push(a);
    return acc;
  }, {});

  return (
    <div style={{ minHeight: '100vh', width: '100vw', background: '#f8faf9', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' }}>
      {/* Nav */}
      <nav style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 40px', height: 64, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 8px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg, #1a9e6b 0%, #0d7a52 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 15 }}>W</div>
          <span style={{ fontFamily: "'Georgia', serif", fontWeight: 700, fontSize: 18, color: '#0f1f17' }}>Well<span style={{ color: '#1a9e6b' }}>being</span></span>
        </Link>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, background: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: 100, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Doctor Portal</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f3faf7', borderRadius: 100, padding: '6px 16px 6px 6px', border: '1px solid #d1fae5' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #1a9e6b, #0d7a52)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 800 }}>{user.name.charAt(0)}</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f1f17' }}>{user.name}</span>
          </div>
          <button onClick={handleLogout} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#6b7280', background: 'none', border: '1.5px solid #e5e7eb', borderRadius: 100, padding: '7px 18px', cursor: 'pointer' }}>Log out</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 24px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 32, fontWeight: 700, color: '#0f1f17', letterSpacing: '-0.02em', marginBottom: 6 }}>Good day, {user.name.split(' ').slice(0,2).join(' ')}. 🩺</h1>
          <p style={{ fontSize: 15, color: '#6b7280' }}>Manage your patient appointments below.</p>
        </div>

        {/* Google Connect Banner */}
        {!googleConnected && (
          <div style={{ background: 'white', border: '1.5px solid #e0e7ff', borderRadius: 16, padding: '20px 24px', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f1f17', marginBottom: 4 }}>🔗 Connect your Google Account</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Required to automatically create Google Meet links for online consultations.</div>
            </div>
            <button onClick={connectGoogle} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: 'white', background: '#4285f4', border: 'none', borderRadius: 100, padding: '10px 22px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              🔑 Connect Google
            </button>
          </div>
        )}

        {googleConnected && googleMsg === 'success' && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 18px', marginBottom: 24, fontSize: 14, color: '#15803d', fontWeight: 600 }}>
            ✅ Google account connected! Online appointments will now auto-generate Meet links.
          </div>
        )}

        {googleConnected && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 18px', marginBottom: 24, fontSize: 13, color: '#15803d' }}>
            ✅ Google Meet connected — online appointments will auto-generate meeting links.
          </div>
        )}

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 36 }}>
          {[['Total', counts.all, '#0f1f17', 'white'], ['Pending', counts.pending, '#854d0e', '#fef9c3'], ['Confirmed', counts.confirmed, '#15803d', '#f0fdf4'], ['Cancelled', counts.cancelled, '#dc2626', '#fef2f2']].map(([label, val, color, bg]) => (
            <div key={label} style={{ background: bg, borderRadius: 16, padding: '20px 24px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontFamily: "'Georgia', serif", fontSize: 30, fontWeight: 700, color }}>{val}</div>
              <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 600, marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'white', borderRadius: 14, padding: 4, border: '1px solid #e5e7eb', width: 'fit-content', marginBottom: 28 }}>
          {['all', 'pending', 'confirmed', 'cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize', background: filter === f ? '#0f1f17' : 'transparent', color: filter === f ? 'white' : '#6b7280' }}>{f}</button>
          ))}
        </div>

        {/* Appointments */}
        {loading ? (
          <p style={{ color: '#9ca3af', textAlign: 'center', padding: '48px 0' }}>Loading appointments…</p>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 20, padding: '56px 32px', textAlign: 'center', border: '1px dashed #e5e7eb' }}>
            <p style={{ fontSize: 15, color: '#9ca3af' }}>No {filter !== 'all' ? filter : ''} appointments yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {Object.entries(grouped).map(([date, appts]) => (
              <div key={date}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                  {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {appts.map(a => <AppointmentRow key={a._id} appt={a} onUpdate={updateStatus} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>
    </div>
  );
}

function AppointmentRow({ appt, onUpdate }) {
  const [open, setOpen] = useState(false);
  const isOnline = appt.mode === 'online';
  const meetingReady = isOnline && appt.meetLink && canStart(appt.date, appt.time);

  return (
    <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${meetingReady ? '#bbf7d0' : '#e5e7eb'}`, overflow: 'hidden', boxShadow: meetingReady ? '0 0 0 2px #4ade8040' : '0 1px 6px rgba(0,0,0,0.04)' }}>
      <div style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #1a9e6b, #0d7a52)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, fontWeight: 800 }}>{appt.patient?.name?.charAt(0) || '?'}</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#0f1f17' }}>{appt.patient?.name || 'Unknown'}</span>
              <span style={{ fontSize: 11, fontWeight: 700, background: isOnline ? '#eff6ff' : '#f0fdf4', color: isOnline ? '#1d4ed8' : '#15803d', padding: '2px 8px', borderRadius: 100 }}>{isOnline ? '💻 Online' : '🏥 In-Person'}</span>
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{appt.type} · {appt.time}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <StatusBadge status={appt.status} />

          {isOnline && appt.meetLink && (
            meetingReady ? (
              <a href={appt.meetLink} target="_blank" rel="noreferrer" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: 'white', background: '#1a73e8', borderRadius: 100, padding: '7px 16px', textDecoration: 'none' }}>🎥 Start Meet</a>
            ) : (
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#9ca3af', background: '#f3f4f6', borderRadius: 100, padding: '7px 12px' }}>🔒 Meet link ready</span>
            )
          )}

          {appt.status === 'pending' && (
            <>
              <ActionBtn color="#15803d" bg="#f0fdf4" border="#bbf7d0" onClick={() => onUpdate(appt._id, 'confirmed')}>Confirm</ActionBtn>
              <ActionBtn color="#dc2626" bg="#fef2f2" border="#fecaca" onClick={() => onUpdate(appt._id, 'cancelled')}>Cancel</ActionBtn>
            </>
          )}
          {appt.status === 'confirmed' && (
            <>
              <ActionBtn color="#1d4ed8" bg="#eff6ff" border="#bfdbfe" onClick={() => onUpdate(appt._id, 'completed')}>Complete</ActionBtn>
              <ActionBtn color="#dc2626" bg="#fef2f2" border="#fecaca" onClick={() => onUpdate(appt._id, 'cancelled')}>Cancel</ActionBtn>
            </>
          )}

          <button onClick={() => setOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16, padding: '4px' }}>{open ? '▲' : '▼'}</button>
        </div>
      </div>

      {open && (
        <div style={{ padding: '0 24px 18px', borderTop: '1px solid #f3f4f6' }}>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 12 }}><strong style={{ color: '#374151' }}>Email:</strong> {appt.patient?.email || '—'}</p>
          {appt.patient?.phone && <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}><strong style={{ color: '#374151' }}>Phone:</strong> {appt.patient.phone}</p>}
          {appt.notes && <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}><strong style={{ color: '#374151' }}>Notes:</strong> {appt.notes}</p>}
          {isOnline && appt.meetLink && <p style={{ fontSize: 13, color: '#1a73e8', marginTop: 4 }}><strong style={{ color: '#374151' }}>Meet link:</strong> <a href={appt.meetLink} target="_blank" rel="noreferrer" style={{ color: '#1a73e8' }}>{appt.meetLink}</a></p>}
        </div>
      )}
    </div>
  );
}

function ActionBtn({ children, onClick, color, bg, border }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: hov ? 'white' : color, background: hov ? color : bg, border: `1.5px solid ${border}`, borderRadius: 100, padding: '6px 14px', cursor: 'pointer', transition: 'all 0.18s' }}>{children}</button>
  );
}

function StatusBadge({ status }) {
  const map = { pending: { bg: '#fef9c3', color: '#854d0e', label: 'Pending' }, confirmed: { bg: '#f0fdf4', color: '#15803d', label: 'Confirmed' }, cancelled: { bg: '#fef2f2', color: '#dc2626', label: 'Cancelled' }, completed: { bg: '#eff6ff', color: '#1d4ed8', label: 'Completed' } };
  const s = map[status] || map.pending;
  return <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, background: s.bg, color: s.color, padding: '5px 12px', borderRadius: 100 }}>{s.label}</span>;
}