# Well Being Clinic — Full Stack Healthcare Platform

A production-ready healthcare platform built for a naturopathy and wellness clinic in Hyderabad, India.

## Live Features

- **Landing Page** — Hero slideshow, 12 treatment packages with modals and pricing, doctor profiles, testimonials
- **Authentication** — JWT-based login/signup with separate patient and doctor roles
- **Appointment Booking** — Real-time availability system with 40-min slots, anti-double-booking protection
- **Google Meet Integration** — Automatically creates unique Google Meet links for online consultations via Google Calendar API
- **AI Chatbot** — Groq LLaMA 3.3 powered assistant with full clinic context for package recommendations and FAQs
- **Doctor Dashboard** — Appointments grouped by date, confirm/cancel/complete actions, Start Meeting button
- **Patient Dashboard** — Unique patient ID (WB-2026-XXXXX), booking history, Join Meeting button active 10 min before appointment

## Tech Stack

**Frontend**
- React 19 + Vite
- React Router v6
- Axios

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs

**Integrations**
- Google Calendar API (automated Meet link generation)
- Groq AI — LLaMA 3.3 70B (AI chatbot)

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Google Cloud Console project with Calendar API enabled
- Groq API key

### Setup

1. Clone the repo
```bash
git clone https://github.com/rohanmadanu/wellbeing-clinic.git
cd wellbeing-clinic
```

2. Install server dependencies
```bash
cd server
npm install
```

3. Create `server/.env`
```
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5001/auth/google/callback
PORT=5001
```

4. Start the server
```bash
node server.js
```

5. Install and start the client
```bash
cd ../client
npm install
npm run dev
```

6. Visit `http://localhost:5173`

## Key Technical Highlights

- **Anti-double-booking** — Atomic conflict check before every appointment save, with MongoDB compound index as a race-condition safety net
- **OAuth 2.0 flow** — Doctors connect their Google account once; refresh tokens stored securely in MongoDB for persistent meeting creation
- **Slot availability** — Dynamic time slot generation (9AM–8PM, Mon–Sat, lunch excluded) with real-time filtering of booked slots
- **Context-aware AI** — Chatbot uses clinic-specific system prompt with all package details, pricing and recommendation logic
- **Patient IDs** — Auto-generated unique IDs in format WB-YYYY-XXXXX on registration
