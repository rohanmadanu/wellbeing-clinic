import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function Signup({ onLogin }) {
  const [step, setStep]     = useState('form'); // 'form' | 'otp'
  const [form, setForm]     = useState({ name: '', email: '', phone: '', password: '', confirm: '', role: 'patient' });
  const [otp, setOtp]       = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();

  function update(field, val) { setForm(f => ({ ...f, [field]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.password) return setError('Please fill in all required fields.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    try {
      setLoading(true);
      await axios.post(`${API}/auth/send-otp`, { email: form.email, name: form.name });
      setOtpSent(true);
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally { setLoading(false); }
  }

  async function handleVerifyOTP(e) {
    e.preventDefault();
    setError('');
    if (!otp || otp.length !== 6) return setError('Please enter the 6-digit OTP.');
    try {
      setLoading(true);
      await axios.post(`${API}/auth/verify-otp`, { email: form.email, otp });
      // OTP verified — now register
      const { data } = await axios.post(`${API}/auth/register`, {
        name: form.name, email: form.email,
        password: form.password, role: form.role, phone: form.phone,
      });
      localStorage.setItem('wb_token', data.token);
      localStorage.setItem('wb_user', JSON.stringify(data.user));
      onLogin(data.user);
      navigate(data.user.role === 'doctor' ? '/doctor' : '/patient');
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Please try again.');
    } finally { setLoading(false); }
  }

  async function resendOTP() {
    setError(''); setOtp('');
    try {
      setLoading(true);
      await axios.post(`${API}/auth/send-otp`, { email: form.email, name: form.name });
      setError('');
    } catch { setError('Failed to resend OTP.'); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f8faf9' }}>
      {/* Left panel */}
      <div style={{ width: '42%', background: 'linear-gradient(160deg, #0f1f17 0%, #1a3d28 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '64px 56px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(26,158,107,0.18) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(74,222,128,0.1) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 56 }}>
            <img src='/logo.jpg' alt='logo' style={{ height: 40, width: 40, objectFit: 'contain', borderRadius: 9 }} />
            <span style={{ fontFamily: "'Georgia', serif", fontWeight: 700, fontSize: 22, color: 'white' }}>Well<span style={{ color: '#1a9e6b' }}>being</span></span>
          </Link>
          <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 36, fontWeight: 700, color: 'white', lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 16 }}>Start your wellness journey.</h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 48 }}>Create your account to book appointments, track your progress and connect with our doctors.</p>
          {[['🌿', 'Personalised treatment plans'],['📅', 'Easy online booking'],['💻', 'Online & in-person consultations'],['🤖', 'AI-powered package guidance']].map(([icon, text]) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 56px' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>

          {step === 'form' ? (
            <>
              {/* Role toggle */}
              <div style={{ display: 'flex', gap: 4, background: '#f3f4f6', borderRadius: 14, padding: 4, marginBottom: 32 }}>
                {['patient','doctor'].map(r => (
                  <button key={r} type="button" onClick={() => update('role', r)} style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s', background: form.role === r ? '#0f1f17' : 'transparent', color: form.role === r ? 'white' : '#6b7280' }}>{r === 'patient' ? '🧑 Patient' : '🩺 Doctor'}</button>
                ))}
              </div>

              <h2 style={{ fontFamily: "'Georgia', serif", fontSize: 28, fontWeight: 700, color: '#0f1f17', marginBottom: 6 }}>Create account</h2>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#9ca3af', marginBottom: 32 }}>Already have an account? <Link to="/login" style={{ color: '#1a9e6b', fontWeight: 700, textDecoration: 'none' }}>Log in</Link></p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <FF label="Full Name *"><input type="text" placeholder="Dr. Ravi Kumar" value={form.name} onChange={e => update('name', e.target.value)} style={IS} onFocus={e => e.target.style.borderColor='#1a9e6b'} onBlur={e => e.target.style.borderColor='#e5e7eb'} /></FF>
                <FF label="Email Address *"><input type="email" placeholder="you@example.com" value={form.email} onChange={e => update('email', e.target.value)} style={IS} onFocus={e => e.target.style.borderColor='#1a9e6b'} onBlur={e => e.target.style.borderColor='#e5e7eb'} /></FF>
                <FF label="Phone Number"><input type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={e => update('phone', e.target.value)} style={IS} onFocus={e => e.target.style.borderColor='#1a9e6b'} onBlur={e => e.target.style.borderColor='#e5e7eb'} /></FF>
                <FF label="Password *"><input type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => update('password', e.target.value)} style={IS} onFocus={e => e.target.style.borderColor='#1a9e6b'} onBlur={e => e.target.style.borderColor='#e5e7eb'} /></FF>
                <FF label="Confirm Password *"><input type="password" placeholder="Repeat password" value={form.confirm} onChange={e => update('confirm', e.target.value)} style={IS} onFocus={e => e.target.style.borderColor='#1a9e6b'} onBlur={e => e.target.style.borderColor='#e5e7eb'} /></FF>
                {error && <div style={{ fontSize: 13, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px' }}>{error}</div>}
                <button type="submit" disabled={loading} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700, color: 'white', background: loading ? '#9ca3af' : 'linear-gradient(135deg, #1a9e6b 0%, #0d7a52 100%)', border: 'none', borderRadius: 100, padding: '14px', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8, boxShadow: '0 6px 20px rgba(26,158,107,0.4)' }}>
                  {loading ? 'Sending OTP…' : 'Continue →'}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* OTP Step */}
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #1a9e6b, #0d7a52)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 20px' }}>📧</div>
                <h2 style={{ fontFamily: "'Georgia', serif", fontSize: 28, fontWeight: 700, color: '#0f1f17', marginBottom: 8 }}>Verify your email</h2>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>We sent a 6-digit OTP to<br /><strong style={{ color: '#0f1f17' }}>{form.email}</strong></p>
              </div>

              <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <input
                  type="text" inputMode="numeric" maxLength={6}
                  placeholder="000000"
                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  style={{ ...IS, fontSize: 28, fontWeight: 700, textAlign: 'center', letterSpacing: '0.3em', padding: '16px' }}
                  onFocus={e => e.target.style.borderColor='#1a9e6b'}
                  onBlur={e => e.target.style.borderColor='#e5e7eb'}
                />
                {error && <div style={{ fontSize: 13, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>{error}</div>}
                <button type="submit" disabled={loading || otp.length !== 6} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700, color: 'white', background: loading || otp.length !== 6 ? '#9ca3af' : 'linear-gradient(135deg, #1a9e6b 0%, #0d7a52 100%)', border: 'none', borderRadius: 100, padding: '14px', cursor: loading || otp.length !== 6 ? 'not-allowed' : 'pointer', boxShadow: '0 6px 20px rgba(26,158,107,0.3)' }}>
                  {loading ? 'Verifying…' : 'Verify & Create Account'}
                </button>
                <div style={{ textAlign: 'center', display: 'flex', gap: 16, justifyContent: 'center' }}>
                  <button type="button" onClick={() => setStep('form')} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>← Change email</button>
                  <button type="button" onClick={resendOTP} disabled={loading} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#1a9e6b', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>Resend OTP</button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>
    </div>
  );
}

function FF({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}</label>
      {children}
    </div>
  );
}

const IS = { fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '11px 14px', borderRadius: 12, border: '1.5px solid #e5e7eb', outline: 'none', background: 'white', color: '#111827', transition: 'border-color 0.2s', width: '100%', boxSizing: 'border-box' };