import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:5001/api';
const TREATMENTS = ['Weight Loss','Pain Management','Menopausal Syndrome','Detox','Migraine','Yoga','Acupuncture','Fatty Liver','High Cholesterol','Sciatica','Spondylitis','Sleep Apnoea','Allergic Rhinitis','General Consultation'];

function authHeaders() {
  return { headers: { Authorization: `Bearer ${localStorage.getItem('wb_token')}` } };
}

// Is it within 10 minutes of the appointment?
function canJoin(date, time) {
  const [timePart, period] = time.split(' ');
  let [h, m] = timePart.split(':').map(Number);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  const apptTime = new Date(`${date}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`);
  const diff = apptTime - new Date();
  return diff <= 10 * 60 * 1000 && diff >= -40 * 60 * 1000;
}

export default function PatientDashboard({ user, onLogout }) {
  const [doctors, setDoctors]           = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [tab, setTab]                   = useState('book');
  const [form, setForm]                 = useState({ doctorId: '', date: '', type: '', notes: '', mode: 'in-person' });
  const [slots, setSlots]               = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [status, setStatus]             = useState('');
  const [loading, setLoading]           = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchDoctors(); fetchAppointments(); }, []);

  useEffect(() => {
    if (form.doctorId && form.date) fetchSlots();
    else { setSlots([]); setSelectedSlot(''); }
  }, [form.doctorId, form.date]);

  async function fetchDoctors() {
    try {
      const { data } = await axios.get(`${API}/doctors`);
      setDoctors(data);
      if (data.length > 0) setForm(f => ({ ...f, doctorId: data[0]._id }));
    } catch {}
  }

  async function fetchSlots() {
    try {
      setLoadingSlots(true);
      setSelectedSlot('');
      const { data } = await axios.get(`${API}/availability?doctorId=${form.doctorId}&date=${form.date}`);
      setSlots(data.slots);
    } catch { setSlots([]); }
    finally { setLoadingSlots(false); }
  }

  async function fetchAppointments() {
    try {
      const { data } = await axios.get(`${API}/appointments/mine`, authHeaders());
      setAppointments(data);
    } catch {}
  }

  async function bookAppointment(e) {
    e.preventDefault();
    setStatus('');
    if (!form.doctorId || !form.date || !selectedSlot || !form.type)
      return setStatus('error:Please fill in all required fields and select a time slot.');
    try {
      setLoading(true);
      await axios.post(`${API}/appointments`, { ...form, time: selectedSlot }, authHeaders());
      setStatus('success:Appointment booked! Check "My Appointments" for your details.');
      setForm(f => ({ ...f, date: '', type: '', notes: '' }));
      setSlots([]); setSelectedSlot('');
      fetchAppointments();
    } catch (err) {
      setStatus(`error:${err.response?.data?.error || 'Booking failed.'}`);
    } finally { setLoading(false); }
  }

  function handleLogout() {
    localStorage.removeItem('wb_token'); localStorage.removeItem('wb_user');
    onLogout(); navigate('/');
  }

  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date(); maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().split('T')[0];
  const statusType = status.split(':')[0];
  const statusMsg  = status.split(':').slice(1).join(':');

  return (
    <div style={{ minHeight: '100vh', width: '100vw', background: '#f8faf9', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' }}>
      {/* Nav */}
      <nav style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 40px', height: 64, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 8px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg, #1a9e6b 0%, #0d7a52 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 15 }}>W</div>
          <span style={{ fontFamily: "'Georgia', serif", fontWeight: 700, fontSize: 18, color: '#0f1f17' }}>Well<span style={{ color: '#1a9e6b' }}>being</span></span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f3faf7', borderRadius: 100, padding: '6px 16px 6px 6px', border: '1px solid #d1fae5' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #1a9e6b, #0d7a52)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 800 }}>{user.name.charAt(0).toUpperCase()}</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f1f17' }}>{user.name}</span>
          </div>
          <button onClick={handleLogout} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#6b7280', background: 'none', border: '1.5px solid #e5e7eb', borderRadius: 100, padding: '7px 18px', cursor: 'pointer' }}>Log out</button>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 32, fontWeight: 700, color: '#0f1f17', letterSpacing: '-0.02em', marginBottom: 6 }}>Good to see you, {user.name.split(' ')[0]}. 👋</h1>
          <p style={{ fontSize: 15, color: '#6b7280' }}>Book appointments and manage your wellness journey.</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'white', borderRadius: 14, padding: 4, border: '1px solid #e5e7eb', width: 'fit-content', marginBottom: 36 }}>
          {[['book','📅 Book Appointment'],['history','📋 My Appointments']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, padding: '9px 22px', borderRadius: 10, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: tab === key ? '#0f1f17' : 'transparent', color: tab === key ? 'white' : '#6b7280' }}>{label}</button>
          ))}
        </div>

        {/* ── BOOK TAB ── */}
        {tab === 'book' && (
          <div style={{ background: 'white', borderRadius: 20, padding: '40px', border: '1px solid #e5e7eb', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontFamily: "'Georgia', serif", fontSize: 24, fontWeight: 700, color: '#0f1f17', marginBottom: 32 }}>Book an Appointment</h2>
            <form onSubmit={bookAppointment} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Mode toggle */}
              <FF label="Appointment Type">
                <div style={{ display: 'flex', gap: 10 }}>
                  {[['in-person','🏥 In-Person'],['online','💻 Online (Zoom)']].map(([val, label]) => (
                    <button key={val} type="button" onClick={() => setForm(f => ({ ...f, mode: val }))} style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, padding: '12px 16px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s', background: form.mode === val ? '#0f1f17' : 'white', color: form.mode === val ? 'white' : '#6b7280', border: form.mode === val ? '2px solid #0f1f17' : '2px solid #e5e7eb' }}>{label}</button>
                  ))}
                </div>
                {form.mode === 'online' && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px' }}>
                    📹 A unique Zoom link will be created and sent to you after booking. The "Join Meeting" button activates 10 minutes before your appointment.
                  </div>
                )}
                {form.mode === 'in-person' && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280', background: '#f8faf9', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px' }}>
                    📍 Indu Fortune Fields, The Annexe, KPHB Colony Phase-13, Kukatpally, Hyderabad 500085
                  </div>
                )}
              </FF>

              {/* Doctor */}
              <FF label="Select Doctor">
                <select value={form.doctorId} onChange={e => setForm(f => ({ ...f, doctorId: e.target.value }))} style={SS}>
                  {doctors.length === 0 ? <option>No doctors available</option> : doctors.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </FF>

              {/* Treatment */}
              <FF label="Treatment Type *">
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={SS}>
                  <option value="">— Select a treatment —</option>
                  {TREATMENTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </FF>

              {/* Date */}
              <FF label="Preferred Date *">
                <input type="date" min={today} max={maxDateStr} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={IS} onFocus={e => e.target.style.borderColor='#1a9e6b'} onBlur={e => e.target.style.borderColor='#e5e7eb'} />
                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>You can book up to 30 days in advance.</p>
              </FF>

              {/* Time slots */}
              {form.date && form.doctorId && (
                <FF label="Available Time Slots *">
                  {loadingSlots ? (
                    <p style={{ fontSize: 13, color: '#9ca3af' }}>Checking availability…</p>
                  ) : slots.length === 0 ? (
                    <div style={{ fontSize: 13, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px' }}>No slots available on this date. Please choose another day.</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
                      {slots.map(slot => (
                        <button key={slot} type="button" onClick={() => setSelectedSlot(slot)} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, padding: '10px 8px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s', background: selectedSlot === slot ? '#1a9e6b' : 'white', color: selectedSlot === slot ? 'white' : '#374151', border: selectedSlot === slot ? '2px solid #1a9e6b' : '2px solid #e5e7eb' }}>{slot}</button>
                      ))}
                    </div>
                  )}
                </FF>
              )}

              {/* Notes */}
              <FF label="Notes / Symptoms (optional)">
                <textarea placeholder="Describe your symptoms or specific concerns…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} style={{ ...IS, resize: 'vertical' }} onFocus={e => e.target.style.borderColor='#1a9e6b'} onBlur={e => e.target.style.borderColor='#e5e7eb'} />
              </FF>

              {statusMsg && (
                <div style={{ fontSize: 13, padding: '10px 14px', borderRadius: 10, background: statusType === 'success' ? '#f0fdf4' : '#fef2f2', color: statusType === 'success' ? '#15803d' : '#dc2626', border: `1px solid ${statusType === 'success' ? '#bbf7d0' : '#fecaca'}` }}>{statusMsg}</div>
              )}

              <SubmitBtn loading={loading}>{loading ? 'Booking…' : 'Confirm Appointment'}</SubmitBtn>
            </form>
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {tab === 'history' && (
          <div>
            <h2 style={{ fontFamily: "'Georgia', serif", fontSize: 24, fontWeight: 700, color: '#0f1f17', marginBottom: 24 }}>My Appointments</h2>
            {appointments.length === 0 ? (
              <div style={{ background: 'white', borderRadius: 20, padding: '56px 32px', textAlign: 'center', border: '1px dashed #e5e7eb' }}>
                <p style={{ fontSize: 15, color: '#9ca3af' }}>No appointments yet.</p>
                <button onClick={() => setTab('book')} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: 'white', background: '#1a9e6b', border: 'none', borderRadius: 100, padding: '10px 24px', cursor: 'pointer', marginTop: 16 }}>Book now</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {appointments.map(a => (
                  <div key={a._id} style={{ background: 'white', borderRadius: 16, padding: '22px 28px', border: '1px solid #e5e7eb', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 16, fontWeight: 700, color: '#0f1f17' }}>{a.type}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, background: a.mode === 'online' ? '#eff6ff' : '#f0fdf4', color: a.mode === 'online' ? '#1d4ed8' : '#15803d', padding: '3px 8px', borderRadius: 100 }}>{a.mode === 'online' ? '💻 Online' : '🏥 In-Person'}</span>
                        </div>
                        <div style={{ fontSize: 13, color: '#6b7280' }}>with {a.doctor?.name || 'Doctor'} · {a.date} · {a.time}</div>
                        {a.notes && <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4, fontStyle: 'italic' }}>{a.notes}</div>}
                        {a.mode === 'in-person' && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>📍 Indu Fortune Fields, KPHB Colony Phase-13, Kukatpally, Hyderabad</div>}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                        <StatusBadge status={a.status} />
                        {a.mode === 'online' && a.zoomJoinUrl && (
                          canJoin(a.date, a.time) ? (
                            <a href={a.zoomJoinUrl} target="_blank" rel="noreferrer" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: 'white', background: '#2563eb', borderRadius: 100, padding: '8px 18px', textDecoration: 'none' }}>🎥 Join Meeting</a>
                          ) : (
                            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#9ca3af', background: '#f3f4f6', borderRadius: 100, padding: '8px 18px' }}>🔒 Join link active 10 min before</span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = { pending: { bg: '#fef9c3', color: '#854d0e', label: 'Pending' }, confirmed: { bg: '#f0fdf4', color: '#15803d', label: 'Confirmed' }, cancelled: { bg: '#fef2f2', color: '#dc2626', label: 'Cancelled' }, completed: { bg: '#eff6ff', color: '#1d4ed8', label: 'Completed' } };
  const s = map[status] || map.pending;
  return <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, background: s.bg, color: s.color, padding: '5px 12px', borderRadius: 100 }}>{s.label}</span>;
}

function FF({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}</label>
      {children}
    </div>
  );
}

function SubmitBtn({ children, loading }) {
  const [hov, setHov] = useState(false);
  return (
    <button type="submit" disabled={loading} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700, color: 'white', border: 'none', borderRadius: 100, padding: '14px', cursor: loading ? 'not-allowed' : 'pointer', background: loading ? '#9ca3af' : (hov ? '#0d7a52' : '#1a9e6b'), transition: 'all 0.2s', alignSelf: 'flex-start', minWidth: 220, boxShadow: hov && !loading ? '0 6px 20px rgba(26,158,107,0.4)' : 'none' }}>{children}</button>
  );
}

const IS = { fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '11px 14px', borderRadius: 12, border: '1.5px solid #e5e7eb', outline: 'none', background: 'white', color: '#111827', transition: 'border-color 0.2s', width: '100%', boxSizing: 'border-box' };
const SS = { ...IS, appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: '36px', cursor: 'pointer' };