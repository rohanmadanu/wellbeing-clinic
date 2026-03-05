import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:5001/api';

export default function Signup({ onLogin }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '', role: 'patient' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function update(field, val) { setForm(f => ({ ...f, [field]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.password) { setError('Please fill in all required fields.'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    try {
      setLoading(true);
      const { data } = await axios.post(`${API}/auth/register`, {
        name: form.name, email: form.email,
        password: form.password, role: form.role, phone: form.phone,
      });
      localStorage.setItem('wb_token', data.token);
      localStorage.setItem('wb_user', JSON.stringify(data.user));
      onLogin(data.user);
      navigate(data.user.role === 'doctor' ? '/doctor' : '/patient');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f8faf9' }}>

      {/* Left panel */}
      <div style={{
        width: '42%', background: 'linear-gradient(160deg, #0f1f17 0%, #1a3d28 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '64px 56px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(26,158,107,0.18) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(74,222,128,0.1) 0%, transparent 70%)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 56 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 11,
              background: 'linear-gradient(135deg, #1a9e6b 0%, #0d7a52 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: 18,
              boxShadow: '0 4px 14px rgba(26,158,107,0.4)',
            }}>W</div>
            <span style={{ fontFamily: "'Georgia', serif", fontWeight: 700, fontSize: 22, color: 'white' }}>
              Well<span style={{ color: '#4ade80' }}>being</span>
            </span>
          </Link>

          <h1 style={{
            fontFamily: "'Georgia', serif", fontSize: 40, fontWeight: 700,
            color: 'white', lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 20,
          }}>
            Start your<br />wellness<br />journey.
          </h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 16,
            color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: 300,
          }}>
            Create an account to book appointments and access personalized care.
          </p>

          <div style={{ width: 48, height: 3, background: '#1a9e6b', borderRadius: 2, marginTop: 40 }} />
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 24 }}>
            Well Being Lifestyle &amp; Pain Clinic<br />
            Kukatpally, Hyderabad
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 32px' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          <h2 style={{
            fontFamily: "'Georgia', serif", fontSize: 30, fontWeight: 700,
            color: '#0f1f17', letterSpacing: '-0.02em', marginBottom: 8,
          }}>Create your account</h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#6b7280', marginBottom: 32 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#1a9e6b', fontWeight: 600, textDecoration: 'none' }}>Log in</Link>
          </p>

          {/* Role selector */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
            {['patient', 'doctor'].map(r => (
              <RoleTab key={r} active={form.role === r} onClick={() => update('role', r)}>
                {r === 'patient' ? '🧑‍⚕️ I\'m a Patient' : '👨‍⚕️ I\'m a Doctor'}
              </RoleTab>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Full name *">
                <input placeholder="Dr. Ravi Kumar" value={form.name}
                  onChange={e => update('name', e.target.value)} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#1a9e6b'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
              </Field>
              <Field label="Phone">
                <input placeholder="9849406028" value={form.phone}
                  onChange={e => update('phone', e.target.value)} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#1a9e6b'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
              </Field>
            </div>

            <Field label="Email address *">
              <input type="email" placeholder="you@example.com" value={form.email}
                onChange={e => update('email', e.target.value)} style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#1a9e6b'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Password *">
                <input type="password" placeholder="Min. 6 characters" value={form.password}
                  onChange={e => update('password', e.target.value)} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#1a9e6b'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
              </Field>
              <Field label="Confirm password *">
                <input type="password" placeholder="Re-enter password" value={form.confirm}
                  onChange={e => update('confirm', e.target.value)} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#1a9e6b'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
              </Field>
            </div>

            {error && (
              <div style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                color: '#dc2626', background: '#fef2f2',
                border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px',
              }}>{error}</div>
            )}

            <SubmitBtn loading={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </SubmitBtn>
          </form>

          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 24 }}>
            By signing up you agree to our{' '}
            <a href="#" style={{ color: '#6b7280', textDecoration: 'underline' }}>Terms of Service</a>
          </p>
        </div>
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>
    </div>
  );
}

function RoleTab({ children, active, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
      padding: '11px 16px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
      background: active ? '#0f1f17' : 'white',
      color: active ? 'white' : '#6b7280',
      border: active ? '2px solid #0f1f17' : '2px solid #e5e7eb',
    }}>{children}</button>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#374151' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function SubmitBtn({ children, loading }) {
  const [hov, setHov] = useState(false);
  return (
    <button type="submit" disabled={loading}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700,
        color: 'white', border: 'none', borderRadius: 100, padding: '14px',
        cursor: loading ? 'not-allowed' : 'pointer',
        background: loading ? '#9ca3af' : (hov ? '#0d7a52' : '#1a9e6b'),
        transition: 'all 0.2s', marginTop: 4,
        boxShadow: hov && !loading ? '0 6px 20px rgba(26,158,107,0.4)' : 'none',
        transform: hov && !loading ? 'translateY(-1px)' : 'none',
      }}>
      {children}
    </button>
  );
}

const inputStyle = {
  fontFamily: "'DM Sans', sans-serif", fontSize: 14,
  padding: '12px 16px', borderRadius: 12,
  border: '1.5px solid #e5e7eb', outline: 'none',
  background: 'white', color: '#111827',
  transition: 'border-color 0.2s',
  width: '100%', boxSizing: 'border-box',
};