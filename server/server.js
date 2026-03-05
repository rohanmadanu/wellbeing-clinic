import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { google } from 'googleapis';
import Groq from 'groq-sdk';
import nodemailer from 'nodemailer';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
// ── Email transporter ─────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

function clinicEmail(to, subject, html) {
  return transporter.sendMail({
    from: `"Well Being Clinic" <${process.env.EMAIL_FROM}>`,
    to, subject, html,
  });
}

const emailBase = (content) => `
  <div style="font-family:'DM Sans',Arial,sans-serif;max-width:580px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:linear-gradient(135deg,#0f1f17 0%,#1a3d2b 100%);padding:32px 40px;text-align:center">
      <div style="display:inline-block;background:linear-gradient(135deg,#1a9e6b,#0d7a52);width:48px;height:48px;border-radius:12px;line-height:48px;font-size:22px;margin-bottom:12px">🌿</div>
      <h1 style="font-family:Georgia,serif;color:white;font-size:22px;margin:0;letter-spacing:-0.3px">Well Being Clinic</h1>
      <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:4px 0 0">Naturopathy & Wellness, Hyderabad</p>
    </div>
    <div style="padding:36px 40px">${content}</div>
    <div style="background:#f8faf9;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb">
      <p style="font-size:12px;color:#9ca3af;margin:0">📍 Indu Fortune Fields, KPHB Colony Phase-13, Kukatpally, Hyderabad 500085</p>
      <p style="font-size:12px;color:#9ca3af;margin:6px 0 0">© 2026 Well Being Clinic. All rights reserved.</p>
    </div>
  </div>
`;

// OTP store (in-memory — fine for this scale)
const otpStore = new Map(); // email -> { otp, expires }

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOTPEmail(email, name) {
  const otp = generateOTP();
  otpStore.set(email, { otp, expires: Date.now() + 10 * 60 * 1000 }); // 10 min
  const html = emailBase(`
    <h2 style="font-family:Georgia,serif;color:#0f1f17;font-size:22px;margin:0 0 8px">Verify your email</h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 28px">Hi ${name}, welcome to Well Being Clinic! Use the OTP below to verify your email address.</p>
    <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:2px solid #bbf7d0;border-radius:16px;padding:28px;text-align:center;margin:0 0 28px">
      <p style="font-size:13px;color:#6b7280;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.1em">Your OTP</p>
      <p style="font-family:Georgia,serif;font-size:42px;font-weight:700;color:#0f1f17;margin:0;letter-spacing:8px">${otp}</p>
      <p style="font-size:12px;color:#9ca3af;margin:8px 0 0">Valid for 10 minutes</p>
    </div>
    <p style="color:#9ca3af;font-size:13px;margin:0">If you did not create an account, please ignore this email.</p>
  `);
  await clinicEmail(email, 'Your Well Being Clinic OTP', html);
  return otp;
}

async function sendBookingConfirmation({ patientEmail, patientName, doctorName, date, time, type, mode, meetLink, patientId }) {
  const modeBlock = mode === 'online' && meetLink
    ? `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px 20px;margin:20px 0">
        <p style="font-size:13px;color:#1d4ed8;font-weight:700;margin:0 0 6px">💻 Online Consultation</p>
        <p style="font-size:13px;color:#374151;margin:0">Your Google Meet link: <a href="${meetLink}" style="color:#1d4ed8">${meetLink}</a></p>
        <p style="font-size:12px;color:#6b7280;margin:6px 0 0">The "Join Meeting" button activates 10 minutes before your appointment.</p>
      </div>`
    : `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin:20px 0">
        <p style="font-size:13px;color:#15803d;font-weight:700;margin:0 0 4px">🏥 In-Person Consultation</p>
        <p style="font-size:13px;color:#374151;margin:0">Indu Fortune Fields, The Annexe, KPHB Colony Phase-13, Kukatpally, Hyderabad 500085</p>
      </div>`;

  const html = emailBase(`
    <h2 style="font-family:Georgia,serif;color:#0f1f17;font-size:22px;margin:0 0 8px">Appointment Confirmed ✅</h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px">Hi ${patientName}, your appointment has been successfully booked.</p>
    <div style="background:#f8faf9;border-radius:14px;padding:20px 24px;margin:0 0 20px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="font-size:13px;color:#9ca3af;padding:6px 0;width:40%">Treatment</td><td style="font-size:14px;font-weight:700;color:#0f1f17;padding:6px 0">${type}</td></tr>
        <tr><td style="font-size:13px;color:#9ca3af;padding:6px 0">Doctor</td><td style="font-size:14px;font-weight:700;color:#0f1f17;padding:6px 0">${doctorName}</td></tr>
        <tr><td style="font-size:13px;color:#9ca3af;padding:6px 0">Date</td><td style="font-size:14px;font-weight:700;color:#0f1f17;padding:6px 0">${date}</td></tr>
        <tr><td style="font-size:13px;color:#9ca3af;padding:6px 0">Time</td><td style="font-size:14px;font-weight:700;color:#0f1f17;padding:6px 0">${time}</td></tr>
        <tr><td style="font-size:13px;color:#9ca3af;padding:6px 0">Patient ID</td><td style="font-size:14px;font-weight:700;color:#1a9e6b;padding:6px 0">${patientId || 'N/A'}</td></tr>
      </table>
    </div>
    ${modeBlock}
    <p style="color:#9ca3af;font-size:13px;margin:24px 0 0">Need to reschedule? Please contact us at least 2 hours before your appointment.</p>
  `);
  await clinicEmail(patientEmail, `Appointment Confirmed — ${type} on ${date}`, html);
}

async function sendStatusUpdateEmail({ patientEmail, patientName, status, type, date, time, doctorName }) {
  const isConfirmed = status === 'confirmed';
  const color = isConfirmed ? '#15803d' : '#dc2626';
  const bg    = isConfirmed ? '#f0fdf4'  : '#fef2f2';
  const border= isConfirmed ? '#bbf7d0'  : '#fecaca';
  const emoji = isConfirmed ? '✅' : '❌';
  const title = isConfirmed ? 'Appointment Confirmed' : 'Appointment Cancelled';
  const msg   = isConfirmed
    ? `Your appointment has been confirmed by ${doctorName}. We look forward to seeing you!`
    : `Your appointment has been cancelled by ${doctorName}. Please book a new slot at your convenience.`;

  const html = emailBase(`
    <h2 style="font-family:Georgia,serif;color:#0f1f17;font-size:22px;margin:0 0 8px">${emoji} ${title}</h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px">Hi ${patientName}, ${msg}</p>
    <div style="background:${bg};border:1px solid ${border};border-radius:14px;padding:20px 24px;margin:0 0 20px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="font-size:13px;color:#9ca3af;padding:6px 0;width:40%">Treatment</td><td style="font-size:14px;font-weight:700;color:${color};padding:6px 0">${type}</td></tr>
        <tr><td style="font-size:13px;color:#9ca3af;padding:6px 0">Doctor</td><td style="font-size:14px;font-weight:700;color:#0f1f17;padding:6px 0">${doctorName}</td></tr>
        <tr><td style="font-size:13px;color:#9ca3af;padding:6px 0">Date</td><td style="font-size:14px;font-weight:700;color:#0f1f17;padding:6px 0">${date}</td></tr>
        <tr><td style="font-size:13px;color:#9ca3af;padding:6px 0">Time</td><td style="font-size:14px;font-weight:700;color:#0f1f17;padding:6px 0">${time}</td></tr>
      </table>
    </div>
    ${!isConfirmed ? '<a href="http://localhost:5173/patient" style="display:inline-block;background:linear-gradient(135deg,#1a9e6b,#0d7a52);color:white;font-weight:700;font-size:14px;padding:12px 28px;border-radius:100px;text-decoration:none;margin-top:8px">Book a New Appointment</a>' : ''}
  `);
  await clinicEmail(patientEmail, `${title} — ${type} on ${date}`, html);
}

async function sendReminderEmail({ patientEmail, patientName, type, date, time, doctorName, mode, meetLink }) {
  const modeText = mode === 'online'
    ? `This is an online consultation. <a href="${meetLink}" style="color:#1d4ed8">Join via Google Meet</a> (link activates 10 min before).`
    : 'This is an in-person visit at Indu Fortune Fields, KPHB Colony Phase-13, Kukatpally, Hyderabad.';

  const html = emailBase(`
    <h2 style="font-family:Georgia,serif;color:#0f1f17;font-size:22px;margin:0 0 8px">⏰ Appointment Reminder</h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px">Hi ${patientName}, this is a reminder that you have an appointment tomorrow.</p>
    <div style="background:#fef9c3;border:1px solid #fde68a;border-radius:14px;padding:20px 24px;margin:0 0 20px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="font-size:13px;color:#9ca3af;padding:6px 0;width:40%">Treatment</td><td style="font-size:14px;font-weight:700;color:#0f1f17;padding:6px 0">${type}</td></tr>
        <tr><td style="font-size:13px;color:#9ca3af;padding:6px 0">Doctor</td><td style="font-size:14px;font-weight:700;color:#0f1f17;padding:6px 0">${doctorName}</td></tr>
        <tr><td style="font-size:13px;color:#9ca3af;padding:6px 0">Date</td><td style="font-size:14px;font-weight:700;color:#0f1f17;padding:6px 0">${date}</td></tr>
        <tr><td style="font-size:13px;color:#9ca3af;padding:6px 0">Time</td><td style="font-size:14px;font-weight:700;color:#0f1f17;padding:6px 0">${time}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;margin:0">${modeText}</p>
  `);
  await clinicEmail(patientEmail, `Reminder: ${type} tomorrow at ${time}`, html);
}



import Patient from './patient.js';
import User from './User.js';
import Appointment from './Appointment.js';

const app = express();
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://wellbeingcures.in', 'https://www.wellbeingcures.in'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors());
app.use(express.json());

// ── MongoDB ───────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected!'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ── Patient ID generator ─────────────────────────────────────────────────────
async function generatePatientId() {
  const year = new Date().getFullYear();
  const count = await User.countDocuments({ role: 'patient' });
  const padded = String(count + 1).padStart(5, '0');
  return `WB-${year}-${padded}`;
}

// ── Slot config ───────────────────────────────────────────────────────────────
const SLOT_DURATION  = 40;
const SLOT_INTERVAL  = 50; // 40 min + 10 min buffer

function generateAllSlots() {
  const slots = [];
  let h = 9, m = 0;
  while (h * 60 + m + SLOT_DURATION <= 20 * 60) {
    const totalMin = h * 60 + m;
    if (!(totalMin >= 13 * 60 && totalMin < 14 * 60)) {
      const period   = h < 12 ? 'AM' : 'PM';
      const displayH = h <= 12 ? h : h - 12;
      const displayM = String(m).padStart(2, '0');
      slots.push(`${displayH}:${displayM} ${period}`);
    }
    m += SLOT_INTERVAL;
    if (m >= 60) { h += Math.floor(m / 60); m = m % 60; }
  }
  return slots;
}
const ALL_SLOTS = generateAllSlots();

// ── Google OAuth client ───────────────────────────────────────────────────────
function makeOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

async function createGoogleMeet({ accessToken, refreshToken, date, time, type, doctorName, patientName }) {
  const oauth2Client = makeOAuthClient();
  oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  // Parse date + time to ISO
  const [timePart, period] = time.split(' ');
  let [h, m] = timePart.split(':').map(Number);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  const startDate = new Date(`${date}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00+05:30`);
  const endDate   = new Date(startDate.getTime() + SLOT_DURATION * 60 * 1000);

  const event = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1,
    requestBody: {
      summary: `Well Being Clinic — ${type}`,
      description: `Online consultation with ${doctorName} for ${patientName}`,
      start: { dateTime: startDate.toISOString(), timeZone: 'Asia/Kolkata' },
      end:   { dateTime: endDate.toISOString(),   timeZone: 'Asia/Kolkata' },
      conferenceData: {
        createRequest: {
          requestId: `wellbeing-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
      attendees: [],
    },
  });

  const meetLink = event.data.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri;
  return { meetLink, eventId: event.data.id };
}

// ── Auth middleware ───────────────────────────────────────────────────────────
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET || 'wellbeing_secret_2025'); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.send('Well Being Clinic Backend is active.'));

// ── Google OAuth flow (for doctors) ──────────────────────────────────────────
// Step 1: Doctor clicks "Connect Google" → redirect to Google
app.get('/auth/google', auth, (req, res) => {
  const oauth2Client = makeOAuthClient();
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    state: req.user.id, // pass doctor ID through the flow
  });
  res.json({ url });
});

// Step 2: Google redirects back with code → save tokens
app.get('/auth/google/callback', async (req, res) => {
  try {
    const { code, state: doctorId } = req.query;
    const oauth2Client = makeOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    await User.findByIdAndUpdate(doctorId, {
      googleAccessToken:  tokens.access_token,
      googleRefreshToken: tokens.refresh_token,
      googleConnected: true,
    });

    // Redirect back to doctor dashboard with success
    res.redirect((process.env.FRONTEND_URL || 'http://localhost:5173') + '/doctor?google=connected');
  } catch (err) {
    console.error('Google callback error:', err.message);
    res.redirect((process.env.FRONTEND_URL || 'http://localhost:5173') + '/doctor?google=error');
  }
});

// Check if doctor has Google connected
app.get('/api/auth/google-status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('googleConnected');
    res.json({ connected: user?.googleConnected || false });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Auth routes ───────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required.' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered.' });
    const hashed = await bcrypt.hash(password, 12);
    const user = new User({ name, email, password: hashed, role: role || 'patient', phone });
    await user.save();
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'wellbeing_secret_2025',
      { expiresIn: '7d' }
    );
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, patientId: user.patientId } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid email or password.' });
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'wellbeing_secret_2025',
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});


// ── OTP: Send ─────────────────────────────────────────────────────────────────
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !name) return res.status(400).json({ error: 'Email and name required.' });
    await sendOTPEmail(email, name);
    res.json({ message: 'OTP sent successfully.' });
  } catch (err) {
    console.error('OTP error FULL:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
    res.status(500).json({ error: err.message || 'Failed to send OTP.' });
  }
});

// ── OTP: Verify ───────────────────────────────────────────────────────────────
app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore.get(email);
  if (!record) return res.status(400).json({ error: 'No OTP found. Please request a new one.' });
  if (Date.now() > record.expires) {
    otpStore.delete(email);
    return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
  }
  if (record.otp !== otp) return res.status(400).json({ error: 'Incorrect OTP. Please try again.' });
  otpStore.delete(email);
  res.json({ verified: true });
});

// ── Availability ──────────────────────────────────────────────────────────────
app.get('/api/availability', async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) return res.status(400).json({ error: 'doctorId and date required.' });
    const booked = await Appointment.find({ doctor: doctorId, date, status: { $ne: 'cancelled' } }).select('time');
    const bookedTimes = new Set(booked.map(a => a.time));
    const today = new Date().toISOString().split('T')[0];
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    const freeSlots = ALL_SLOTS.filter(slot => {
      if (bookedTimes.has(slot)) return false;
      if (date === today) {
        const [tp, pd] = slot.split(' ');
        let [h, m] = tp.split(':').map(Number);
        if (pd === 'PM' && h !== 12) h += 12;
        if (pd === 'AM' && h === 12) h = 0;
        return h * 60 + m > nowMin + 30;
      }
      return true;
    });
    res.json({ slots: freeSlots });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Book appointment ──────────────────────────────────────────────────────────
app.post('/api/appointments', auth, async (req, res) => {
  try {
    const { doctorId, date, time, type, notes, mode } = req.body;
    if (!doctorId || !date || !time || !type || !mode)
      return res.status(400).json({ error: 'Doctor, date, time, type and mode are required.' });

    // Anti-double-booking
    const conflict = await Appointment.findOne({ doctor: doctorId, date, time, status: { $ne: 'cancelled' } });
    if (conflict)
      return res.status(409).json({ error: 'Sorry, that slot was just booked. Please choose another time.' });

    // Create Google Meet if online
    let meetLink = null;
    if (mode === 'online') {
      const doctor = await User.findById(doctorId).select('name googleAccessToken googleRefreshToken googleConnected');
      if (!doctor.googleConnected)
        return res.status(400).json({ error: 'Doctor has not connected their Google account yet. Please choose In-Person or try again later.' });
      try {
        const patient = await User.findById(req.user.id).select('name');
        const result = await createGoogleMeet({
          accessToken:  doctor.googleAccessToken,
          refreshToken: doctor.googleRefreshToken,
          date, time, type,
          doctorName:  doctor.name,
          patientName: patient.name,
        });
        meetLink = result.meetLink;
      } catch (gErr) {
        console.error('Google Meet error:', gErr.message);
        return res.status(500).json({ error: 'Failed to create Google Meet. Please try again.' });
      }
    }

    const appt = new Appointment({
      patient: req.user.id, doctor: doctorId,
      date, time, type, notes, mode,
      meetLink,
    });
    await appt.save();
    const populated = await appt.populate(['patient', 'doctor']);
    // Send booking confirmation email
    try {
      const pat = await User.findById(req.user.id).select('name email patientId');
      const doc = await User.findById(doctorId).select('name');
      await sendBookingConfirmation({
        patientEmail: pat.email, patientName: pat.name,
        doctorName: doc.name, date, time, type, mode,
        meetLink: meetLink || null, patientId: pat.patientId,
      });
    } catch (e) { console.error('Booking email error:', e.message); }
    res.status(201).json(populated);
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ error: 'Sorry, that slot was just booked. Please choose another time.' });
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/appointments/mine', auth, async (req, res) => {
  try {
    const appts = await Appointment.find({ patient: req.user.id })
      .populate('doctor', 'name email')
      .sort({ date: 1, time: 1 });
    res.json(appts);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/appointments/doctor', auth, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') return res.status(403).json({ error: 'Doctors only.' });
    const appts = await Appointment.find({ doctor: req.user.id })
      .populate('patient', 'name email phone')
      .sort({ date: 1, time: 1 });
    res.json(appts);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/appointments/:id', auth, async (req, res) => {
  try {
    const appt = await Appointment.findByIdAndUpdate(
      req.params.id, { status: req.body.status }, { new: true }
    ).populate('patient', 'name email');
    // Send status update email for confirmed/cancelled
    if (['confirmed','cancelled'].includes(req.body.status)) {
      try {
        const doc = await User.findById(req.user.id).select('name');
        await sendStatusUpdateEmail({
          patientEmail: appt.patient.email, patientName: appt.patient.name,
          status: req.body.status, type: appt.type,
          date: appt.date, time: appt.time, doctorName: doc.name,
        });
      } catch (e) { console.error('Status email error:', e.message); }
    }
    res.json(appt);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/doctors', async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('name email googleConnected');
    res.json(doctors);
  } catch (err) { res.status(500).json({ error: err.message }); }
});


// ── AI Chatbot ────────────────────────────────────────────────────────────────
const CLINIC_CONTEXT = `
You are the Well Being Clinic AI assistant. Be warm, helpful and concise.
Always respond in 2-4 short paragraphs max. Use simple language.

CLINIC INFO:
- Name: Well Being Clinic
- Doctors: Dr. Ravi Kumar (Naturopath, 25+ years experience), Dr. Parameswari (Yoga & Wellness specialist)
- Address: Indu Fortune Fields, The Annexe, KPHB Colony Phase-13, Kukatpally, Hyderabad 500085
- Timings: Monday–Saturday, 9:00 AM – 8:00 PM (Lunch: 1–2 PM)
- Contact: Available via online booking on this website
- Consultations: Both in-person and online (Google Meet) available

PACKAGES & PRICING:
1. Weight Loss – 4 Weeks ₹3999 / 8 Weeks ₹6999 / 12 Weeks ₹9999
2. Fatty Liver – 4 Weeks ₹4499 / 8 Weeks ₹7999 / 12 Weeks ₹10999
3. High Cholesterol – 4 Weeks ₹3999 / 8 Weeks ₹7499 / 12 Weeks ₹9999
4. Detox – 4 Weeks ₹3499 / 8 Weeks ₹5999
5. Pain Management – 4 Weeks ₹3999 / 8 Weeks ₹6999 / 12 Weeks ₹9999
6. Yoga Therapy – 6 Weeks ₹4999 / 12 Weeks ₹8999
7. Menopausal Syndrome – 8 Weeks ₹6999 / 12 Weeks ₹9999
8. Sciatica – 4 Weeks ₹3999 / 8 Weeks ₹6999 / 12 Weeks ₹9999
9. Spondylitis – 4 Weeks ₹3999 / 8 Weeks ₹6999 / 12 Weeks ₹9999
10. Migraine – 4 Weeks ₹3999 / 8 Weeks ₹6999 / 12 Weeks ₹9999
11. Sleep Apnoea – 4 Weeks ₹3999 / 8 Weeks ₹6999 / 12 Weeks ₹9999
12. Allergic Rhinitis – 4 Weeks ₹3999 / 8 Weeks ₹6999

PACKAGE RECOMMENDATION GUIDE:
- Weight issues → Weight Loss package
- Liver problems, high triglycerides, metabolic issues → Fatty Liver package
- High LDL, heart risk → High Cholesterol package
- Fatigue, toxin buildup, digestive reset → Detox package
- Chronic body pain, joint pain → Pain Management package
- Stress, anxiety, flexibility → Yoga Therapy package
- Menopause symptoms, hormonal issues → Menopausal Syndrome package
- Lower back pain radiating to legs → Sciatica package
- Neck or back stiffness, cervical issues → Spondylitis package
- Frequent headaches → Migraine package
- Snoring, poor sleep, daytime fatigue → Sleep Apnoea package
- Nasal allergies, congestion, sinusitis → Allergic Rhinitis package

BOOKING:
- Patients can sign up on the website and book appointments online
- Slots are 40 minutes, available Mon–Sat 9AM–8PM
- Online consultations via Google Meet are available

Always end your response by gently encouraging the user to book a consultation or sign up if they seem interested.
`;

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required.' });

    const messages = [
      { role: 'system', content: CLINIC_CONTEXT },
      ...history.slice(-6).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
      { role: 'user', content: message },
    ];

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 400,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || 'I\'m sorry, I couldn\'t process that. Please try again.';
    res.json({ reply });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: 'Chat failed.', reply: 'Sorry, I\'m having trouble right now. Please call us directly or try again later.' });
  }
});

// ── Legacy patient routes ─────────────────────────────────────────────────────
app.get('/api/patients', async (req, res) => {
  try { res.json(await Patient.find().sort({ createdAt: -1 })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/patients', async (req, res) => {
  try {
    const { name, age, gender, category, history } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const patient = new Patient({ name, age, gender, category, history });
    await patient.save();
    res.status(201).json(patient);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/patients/:id', async (req, res) => {
  try { await Patient.findByIdAndDelete(req.params.id); res.json({ message: 'Patient deleted' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});


// ── Daily reminder cron (runs at 9AM every day) ───────────────────────────────
async function sendDailyReminders() {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    const appts = await Appointment.find({ date: dateStr, status: 'confirmed' })
      .populate('patient', 'name email')
      .populate('doctor', 'name');
    console.log(`📧 Sending reminders for ${appts.length} appointments on ${dateStr}`);
    for (const a of appts) {
      try {
        await sendReminderEmail({
          patientEmail: a.patient.email, patientName: a.patient.name,
          type: a.type, date: a.date, time: a.time,
          doctorName: a.doctor.name, mode: a.mode, meetLink: a.meetLink,
        });
      } catch (e) { console.error('Reminder error for', a.patient.email, e.message); }
    }
  } catch (err) { console.error('Reminder cron error:', err.message); }
}

// Schedule reminder at 9AM IST every day
function scheduleDailyReminders() {
  const now = new Date();
  const next9AM = new Date();
  next9AM.setHours(9, 0, 0, 0);
  if (now >= next9AM) next9AM.setDate(next9AM.getDate() + 1);
  const msUntil9AM = next9AM - now;
  setTimeout(() => {
    sendDailyReminders();
    setInterval(sendDailyReminders, 24 * 60 * 60 * 1000);
  }, msUntil9AM);
  console.log(`⏰ Reminder cron scheduled — next run in ${Math.round(msUntil9AM/1000/60)} minutes`);
}

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server listening at http://localhost:${PORT}`);
  scheduleDailyReminders();
});