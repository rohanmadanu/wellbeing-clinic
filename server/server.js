import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { google } from 'googleapis';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

import Patient from './patient.js';
import User from './User.js';
import Appointment from './Appointment.js';

const app = express();
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
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
    res.redirect('http://localhost:5173/doctor?google=connected');
  } catch (err) {
    console.error('Google callback error:', err.message);
    res.redirect('http://localhost:5173/doctor?google=error');
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

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server listening at http://localhost:${PORT}`));