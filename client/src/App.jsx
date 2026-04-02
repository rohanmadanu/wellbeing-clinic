import { useState, useEffect, useCallback } from 'react';
import Chatbot from './Chatbot';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Login from './Login';
import Signup from './Signup';
import PatientDashboard from './PatientDashboard';
import DoctorDashboard from './DoctorDashboard';

// ─── Hero Slides ──────────────────────────────────────────────────────────────
const HERO_SLIDES = [
  {
    id: 0,
    image: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=1600&q=80&fit=crop',
    tag: 'Primary Care',
    headline: 'Healthcare that\nworks around you.',
    sub: 'Same-day appointments, 24/7 virtual care, and a care team that truly knows you.',
    cta: 'Find a location',
    accent: '#1a6b4a',
  },
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1600&q=80&fit=crop',
    tag: 'Mental Wellness',
    headline: 'Mind and body,\ncared for together.',
    sub: 'Integrated mental health services with licensed therapists and psychiatrists.',
    cta: 'Explore mental health',
    accent: '#1a4a6b',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1600&q=80&fit=crop',
    tag: 'Holistic Care',
    headline: 'Heal naturally,\nlive fully.',
    sub: 'Naturopathy, acupuncture and yoga — rooted in science, tailored to you.',
    cta: 'Book Consultation',
    accent: '#4a1a6b',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1600&q=80&fit=crop',
    tag: 'Lifestyle Medicine',
    headline: 'Your health,\our priority.',
    sub: 'Comprehensive care for chronic conditions, pain relief and long-term wellness.',
    cta: 'Book Consultation',
    accent: '#6b3a1a',
  },
];

const PACKAGES = [
  {
    title: 'Weight Loss',
    desc: 'A personalized weight management program designed to help you reach your ideal weight safely and sustainably.',
    image: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=600&q=80&fit=crop',
    overview: 'Weight Loss & Obesity Management Program (8–12 weeks)',
    overviewDesc: 'A personalized weight management program designed to help you reach your ideal weight safely and sustainably through naturopathy and lifestyle changes.',
    forWhom: ['Individuals with obesity or excess weight', 'People with hormonal weight gain', 'Patients with lifestyle-related weight issues', 'Those who have tried dieting without success'],
    results: ['Sustainable weight reduction', 'Improved metabolism', 'Better energy levels', 'Reduced health risks'],
    includes: ['Body composition assessment', 'Doctor consultation', 'Personalized diet plan', 'Exercise and activity guidelines', 'Lifestyle modification program', 'Weekly progress monitoring'],
    plans: [{ duration: '4 Weeks', price: '₹3999' }, { duration: '8 Weeks', price: '₹6999' }, { duration: '12 Weeks', price: '₹9999' }],
  },
  {
    title: 'Fatty Liver',
    desc: 'Structured naturopathic and dietary programs to reverse fatty liver and restore healthy liver function.',
    image: '/Fatty Liver.webp',
    overview: 'Fatty Liver Recovery Program (8–12 weeks)',
    overviewDesc: 'A specialized treatment plan focused on reversing fatty liver through targeted nutrition, lifestyle changes, and medical monitoring.',
    forWhom: ['Patients diagnosed with fatty liver (Grade 1 or 2)', 'Individuals with high triglycerides', 'People with metabolic syndrome', 'Those experiencing fatigue and digestive issues'],
    results: ['Reduction in liver fat accumulation', 'Improved liver enzyme levels', 'Better digestion and metabolism', 'Reduced inflammation'],
    includes: ['Liver health assessment', 'Doctor consultation', 'Liver-friendly diet plan', 'Detox and metabolic reset program', 'Exercise recommendations', 'Periodic follow-up consultations', 'Progress monitoring'],
    plans: [{ duration: '4 Weeks', price: '₹4499' }, { duration: '8 Weeks', price: '₹7999' }, { duration: '12 Weeks', price: '₹10999' }],
  },
  {
    title: 'High Cholesterol',
    desc: 'Lifestyle and nutrition-based interventions to naturally lower cholesterol and protect heart health.',
    image: '/High Cholesterol.jpeg',
    overview: 'Cholesterol Management Program (8–12 weeks)',
    overviewDesc: 'A structured program designed to control cholesterol levels naturally through diet, lifestyle modifications, and medical supervision.',
    forWhom: ['Patients with high LDL cholesterol', 'Individuals with heart disease risk', 'People with sedentary lifestyles', 'Patients with family history of cholesterol problems'],
    results: ['Reduced LDL cholesterol', 'Improved HDL levels', 'Lower cardiovascular risk', 'Better heart health'],
    includes: ['Cholesterol risk assessment', 'Doctor consultation', 'Heart-healthy diet plan', 'Exercise and activity guidelines', 'Lifestyle modification program', 'Progress tracking and monitoring'],
    plans: [{ duration: '4 Weeks', price: '₹3999' }, { duration: '8 Weeks', price: '₹7499' }, { duration: '12 Weeks', price: '₹9999' }],
  },
  {
    title: 'Detox',
    desc: 'A guided nutritional cleanse to help eliminate toxins, boost energy, and reset your system.',
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&q=80&fit=crop',
    overview: 'Metabolic Detox Program (4–8 weeks)',
    overviewDesc: 'A structured detox program designed to support the body\u2019s natural detoxification systems and improve metabolic health.',
    forWhom: ['Individuals with fatigue or low energy', 'People experiencing digestive issues', 'Those exposed to stress and unhealthy diet', 'Individuals seeking metabolic reset'],
    results: ['Improved digestion', 'Better energy levels', 'Reduced inflammation', 'Enhanced metabolic function'],
    includes: ['Health and lifestyle assessment', 'Doctor consultation', 'Detox nutrition plan', 'Guided detox routines', 'Yoga and breathing exercises', 'Weekly progress check-ins'],
    plans: [{ duration: '4 Weeks', price: '₹3499' }, { duration: '8 Weeks', price: '₹5999' }],
  },
  {
    title: 'Pain Management',
    desc: 'Evidence-based therapies and lifestyle plans to manage chronic pain and improve daily function.',
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80&fit=crop',
    overview: 'Chronic Pain Management Program (8–12 weeks)',
    overviewDesc: 'A comprehensive program designed to manage chronic pain through physiotherapy, therapeutic exercises, and lifestyle changes.',
    forWhom: ['Individuals with chronic body pain', 'Patients with muscle stiffness or joint pain', 'Office workers with posture-related pain', 'Individuals recovering from injury'],
    results: ['Reduced pain and stiffness', 'Improved mobility', 'Strengthened muscles and joints', 'Better posture and body mechanics'],
    includes: ['Pain assessment consultation', 'Doctor evaluation', 'Therapeutic exercise plan', 'Physiotherapy guidance', 'Posture correction program', 'Follow-up monitoring'],
    plans: [{ duration: '4 Weeks', price: '₹3999' }, { duration: '8 Weeks', price: '₹6999' }, { duration: '12 Weeks', price: '₹9999' }],
  },
  {
    title: 'Yoga',
    desc: 'Holistic yoga sessions tailored to improve flexibility, balance, strength, and mental wellbeing.',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80&fit=crop',
    overview: 'Therapeutic Yoga Program (6–12 weeks)',
    overviewDesc: 'A holistic therapy program that uses yoga, breathing exercises, and mindfulness to improve physical and mental health.',
    forWhom: ['Individuals with stress and anxiety', 'Patients with lifestyle disorders', 'People seeking holistic healing', 'Individuals with posture problems'],
    results: ['Reduced stress levels', 'Improved flexibility and posture', 'Better breathing capacity', 'Improved overall well-being'],
    includes: ['Yoga therapy assessment', 'Guided yoga sessions', 'Breathing and relaxation techniques', 'Lifestyle and mindfulness coaching', 'Weekly progress tracking'],
    plans: [{ duration: '6 Weeks', price: '₹4999' }, { duration: '12 Weeks', price: '₹8999' }],
  },
  {
    title: 'Menopausal Syndrome',
    desc: 'Specialized support to manage hormonal changes, symptoms, and overall wellness through menopause.',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80&fit=crop',
    overview: 'Menopause Wellness Program (8–12 weeks)',
    overviewDesc: 'A specialized program designed to help women manage hormonal changes and symptoms associated with menopause.',
    forWhom: ['Women experiencing menopause symptoms', 'Individuals with hot flashes and mood swings', 'Women with sleep disturbances', 'Patients with hormonal imbalance'],
    results: ['Reduced menopause symptoms', 'Better hormonal balance', 'Improved sleep quality', 'Improved emotional well-being'],
    includes: ['Hormonal health assessment', 'Doctor consultation', 'Hormone-friendly diet plan', 'Lifestyle and stress management program', 'Exercise recommendations', 'Follow-up monitoring'],
    plans: [{ duration: '8 Weeks', price: '₹6999' }, { duration: '12 Weeks', price: '₹9999' }],
  },
  {
    title: 'Sciatica',
    desc: 'Targeted acupuncture, physiotherapy and yoga to relieve sciatic nerve pain radiating from the lower back to the legs.',
    image: '/Sciatica.webp',
    overview: 'Sciatica Relief Program (8–12 weeks)',
    overviewDesc: 'A targeted program designed to relieve sciatic nerve pain through acupuncture, physiotherapy and guided exercises.',
    forWhom: ['Patients with sciatica pain', 'Individuals with lower back pain radiating to legs', 'People with prolonged sitting posture', 'Patients with herniated disc'],
    results: ['Reduced nerve pain', 'Improved spinal mobility', 'Reduced muscle stiffness', 'Better posture'],
    includes: ['Spine health assessment', 'Doctor consultation', 'Acupuncture sessions', 'Therapeutic exercise plan', 'Physiotherapy guidance', 'Posture correction training', 'Follow-up monitoring'],
    plans: [{ duration: '4 Weeks', price: '₹3999' }, { duration: '8 Weeks', price: '₹6999' }, { duration: '12 Weeks', price: '₹9999' }],
  },
  {
    title: 'Spondylitis',
    desc: 'Specialised treatment for cervical and lumbar spondylitis — reducing neck and back stiffness through naturopathy and physiotherapy.',
    image: '/spondylitis.jpg',
    overview: 'Spondylitis Care Program (8–12 weeks)',
    overviewDesc: 'A comprehensive program for cervical and lumbar spondylitis — reducing stiffness and pain through naturopathy and physiotherapy.',
    forWhom: ['Patients with cervical spondylitis', 'Individuals with lumbar spondylitis', 'People with chronic neck or back pain', 'Patients with prolonged desk work strain'],
    results: ['Reduced neck and back pain', 'Improved spinal flexibility', 'Reduced inflammation', 'Better posture'],
    includes: ['Spine health assessment', 'Doctor consultation', 'Therapeutic exercise plan', 'Physiotherapy guidance', 'Posture correction training', 'Follow-up monitoring'],
    plans: [{ duration: '4 Weeks', price: '₹3999' }, { duration: '8 Weeks', price: '₹6999' }, { duration: '12 Weeks', price: '₹9999' }],
  },
  {
    title: 'Migraine',
    desc: 'Targeted assessment and treatment plans to reduce migraine frequency, severity, and triggers.',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80&fit=crop',
    overview: 'Migraine Management Program (8–12 weeks)',
    overviewDesc: 'A holistic program to identify migraine triggers and reduce frequency through naturopathy, diet and lifestyle changes.',
    forWhom: ['Patients with frequent migraines', 'Individuals with chronic headaches', 'People with stress-related migraines', 'Patients seeking drug-free relief'],
    results: ['Reduced migraine frequency', 'Lower pain severity', 'Better trigger management', 'Improved sleep and stress levels'],
    includes: ['Migraine trigger assessment', 'Doctor consultation', 'Diet and nutrition plan', 'Stress management program', 'Acupuncture sessions', 'Progress monitoring'],
    plans: [{ duration: '4 Weeks', price: '₹3999' }, { duration: '8 Weeks', price: '₹6999' }, { duration: '12 Weeks', price: '₹9999' }],
  },
  {
    title: 'Sleep Apnoea',
    desc: 'Holistic management of obstructive sleep apnoea — improving airway health, sleep quality and daytime energy naturally.',
    image: '/Sleep Apnoea.jpg',
    overview: 'Sleep & Respiratory Health Program (8–12 weeks)',
    overviewDesc: 'A treatment program aimed at improving breathing patterns, sleep quality and respiratory health naturally.',
    forWhom: ['Patients with sleep apnea', 'Individuals with chronic snoring', 'People with disturbed sleep', 'Those with daytime fatigue'],
    results: ['Improved sleep quality', 'Reduced snoring episodes', 'Better breathing and airway health', 'Increased daytime energy'],
    includes: ['Sleep health assessment', 'Doctor consultation', 'Lifestyle and breathing therapy plan', 'Nasal and respiratory exercises', 'Sleep improvement strategies', 'Progress monitoring'],
    plans: [{ duration: '4 Weeks', price: '₹3999' }, { duration: '8 Weeks', price: '₹6999' }, { duration: '12 Weeks', price: '₹9999' }],
  },
  {
    title: 'Allergic Rhinitis',
    desc: 'Natural relief from chronic nasal allergies, congestion and sinusitis through naturopathy and dietary management.',
    image: '/Allergic Rhinitis.jpg',
    overview: 'Allergic Rhinitis Relief Program (4–8 weeks)',
    overviewDesc: 'A naturopathic program to manage chronic nasal allergies, reduce congestion and improve respiratory health naturally.',
    forWhom: ['Patients with allergic rhinitis', 'Individuals with chronic nasal congestion', 'People with dust or pollen allergies', 'Patients with sinusitis'],
    results: ['Reduced allergy symptoms', 'Better nasal breathing', 'Reduced congestion and sinusitis', 'Improved quality of life'],
    includes: ['Allergy health assessment', 'Doctor consultation', 'Anti-inflammatory diet plan', 'Nasal and breathing exercises', 'Lifestyle modification program', 'Progress monitoring'],
    plans: [{ duration: '4 Weeks', price: '₹3999' }, { duration: '8 Weeks', price: '₹6999' }],
  },
];

const STATS = [
  { value: '25+',   label: 'Years of experience' },
  { value: '4.9★',  label: 'Average rating' },
  { value: '24/7',  label: 'Virtual access' },
];

const TESTIMONIALS = [
  {
    quote: "Dr Ravi has one of the greatest virtues of being a good doctor, i.e. Listening patiently to the problem the patient puts forward.",
    name: 'C. Shruthi', role: 'Patient',
  },
  {
    quote: "I took 15 sittings and the pain is completely gone. Thanks dr.ravi and the staff members for immaculate service provided.",
    name: 'C. Jawahar Babu', role: 'Patient',
  },
  {
    quote: "He maintains utmost professional approach towards his patient and is ever willing to provide the best possible solution.",
    name: 'Sanjay Solanki', role: 'Patient',
  },
];

// ─── NavBar ────────────────────────────────────────────────────────────────────
function NavBar({ scrolled }) {
  const navigate = useNavigate();
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      transition: 'all 0.35s ease',
      background: scrolled ? 'rgba(255,255,255,0.97)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(0,0,0,0.07)' : '1px solid transparent',
      boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.06)' : 'none',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src='/logo.jpg' alt='Well Being Clinic' style={{ height: 44, width: 44, objectFit: 'contain', borderRadius: 8 }} />
          <span style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontWeight: 700, fontSize: 20,
            color: scrolled ? '#0f1f17' : 'white',
            letterSpacing: '-0.3px',
            transition: 'color 0.3s',
          }}>
            Well<span style={{ color: '#1a9e6b' }}>being</span>
          </span>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
          <NavLink scrolled={scrolled} onClick={() => document.getElementById('packages')?.scrollIntoView({ behavior: 'smooth' })}>Services</NavLink>
          <NavLink scrolled={scrolled} onClick={() => document.getElementById('doctors')?.scrollIntoView({ behavior: 'smooth' })}>Our Doctors</NavLink>
          <NavLink scrolled={scrolled} onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>Contact</NavLink>
          <NavLink scrolled={scrolled} onClick={() => document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' })}>Testimonials</NavLink>
        </div>

        {/* Auth buttons */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <OutlineBtn onClick={() => navigate('/login')}>Log in</OutlineBtn>
          <GreenBtn onClick={() => navigate('/signup')}>Sign up</GreenBtn>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ children, scrolled, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <a href="#" onClick={e => { e.preventDefault(); onClick && onClick(); }} style={{
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 14, fontWeight: 500,
      color: hov ? '#1a9e6b' : (scrolled ? '#374151' : 'rgba(255,255,255,0.88)'),
      textDecoration: 'none', transition: 'color 0.2s', letterSpacing: '0.01em', cursor: 'pointer',
    }} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {children}
    </a>
  );
}

function OutlineBtn({ children, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} style={{
      fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700,
      color: hov ? 'white' : '#0d5c3e',
      background: hov ? '#0d5c3e' : '#d6f0e6',
      border: 'none',
      borderRadius: 100, padding: '10px 24px', cursor: 'pointer', transition: 'all 0.22s',
      boxShadow: hov ? '0 4px 14px rgba(13,92,62,0.28)' : 'none',
      transform: hov ? 'translateY(-1px)' : 'none',
    }} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {children}
    </button>
  );
}

function GreenBtn({ children, large, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} style={{
      fontFamily: "'DM Sans', sans-serif",
      fontSize: large ? 16 : 14, fontWeight: 700,
      color: 'white',
      background: 'linear-gradient(135deg, #1a9e6b 0%, #0d7a52 100%)',
      border: 'none', borderRadius: 100,
      padding: large ? '14px 32px' : '10px 24px',
      cursor: 'pointer', transition: 'all 0.2s',
      boxShadow: hov ? '0 8px 24px rgba(26,158,107,0.55)' : '0 4px 14px rgba(26,158,107,0.4)',
      transform: hov ? 'translateY(-2px)' : 'none',
    }} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {children}
    </button>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────────────────
function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const goTo = useCallback((idx) => {
    if (transitioning || idx === current) return;
    setTransitioning(true);
    setCurrent(idx);
    setTimeout(() => setTransitioning(false), 900);
  }, [current, transitioning]);

  useEffect(() => {
    const id = setInterval(() => goTo((current + 1) % HERO_SLIDES.length), 5500);
    return () => clearInterval(id);
  }, [current, goTo]);

  const slide = HERO_SLIDES[current];

  return (
    <section style={{ position: 'relative', height: '100vh', minHeight: 640, overflow: 'hidden' }}>
      {/* Slide images */}
      {HERO_SLIDES.map((s, i) => (
        <div key={s.id} style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${s.image})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          transition: 'opacity 0.9s cubic-bezier(0.4,0,0.2,1)',
          opacity: i === current ? 1 : 0,
        }} />
      ))}

      {/* Overlays */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.28) 65%, rgba(0,0,0,0.08) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 18% 62%, ${slide.accent}44 0%, transparent 55%)`, transition: 'background 1s ease' }} />

      {/* Hero content */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: 1200, margin: '0 auto', padding: '0 48px', height: '100%', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: 600 }}>

          {/* Tag */}
          <div key={`tag-${current}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'rgba(255,255,255,0.13)', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.22)', borderRadius: 100,
            padding: '5px 14px', marginBottom: 26,
            animation: 'fadeUp 0.55s ease both',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'block' }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, color: 'white', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {slide.tag}
            </span>
          </div>

          {/* Headline */}
          <h1 key={`h-${current}`} style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(42px, 5.8vw, 72px)', fontWeight: 700,
            color: 'white', lineHeight: 1.08, letterSpacing: '-0.03em',
            marginBottom: 22, whiteSpace: 'pre-line',
            animation: 'fadeUp 0.65s ease 0.08s both',
          }}>
            {slide.headline}
          </h1>

          {/* Sub */}
          <p key={`p-${current}`} style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 18, fontWeight: 400,
            color: 'rgba(255,255,255,0.78)', lineHeight: 1.7,
            marginBottom: 38, maxWidth: 460,
            animation: 'fadeUp 0.65s ease 0.16s both',
          }}>
            {slide.sub}
          </p>

          {/* Buttons */}
          <div key={`btn-${current}`} style={{ display: 'flex', gap: 12, animation: 'fadeUp 0.65s ease 0.24s both' }}>
            <GreenBtn large onClick={() => navigate('/signup')}>Book Consultation</GreenBtn>
            <GhostBtn>Learn more</GhostBtn>
          </div>
        </div>
      </div>

      {/* Dots */}
      <div style={{ position: 'absolute', bottom: 38, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 20 }}>
        {HERO_SLIDES.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} style={{
            width: i === current ? 28 : 8, height: 8, borderRadius: 100, border: 'none',
            background: i === current ? 'white' : 'rgba(255,255,255,0.38)',
            cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)', padding: 0,
          }} />
        ))}
      </div>

      {/* Scroll hint */}
      <div style={{ position: 'absolute', bottom: 34, right: 48, zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Scroll</span>
        <div style={{ width: 1, height: 30, background: 'linear-gradient(to bottom, rgba(255,255,255,0.45), transparent)' }} />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}

function GhostBtn({ children }) {
  const [hov, setHov] = useState(false);
  return (
    <button style={{
      fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700,
      color: 'white', padding: '13px 28px', borderRadius: 100,
      border: '2px solid rgba(255,255,255,0.55)',
      background: hov ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)',
      backdropFilter: 'blur(8px)', cursor: 'pointer', transition: 'all 0.22s',
      transform: hov ? 'translateY(-2px)' : 'none',
    }} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {children}
    </button>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────
function StatsBar() {
  return (
    <section style={{ background: '#0f1f17', padding: '40px 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {STATS.map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Georgia', serif", fontSize: 38, color: '#4ade80', fontWeight: 700, letterSpacing: '-0.02em' }}>{s.value}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Packages ─────────────────────────────────────────────────────────────────
function PackagesSection() {
  const [selected, setSelected] = useState(null);
  return (
    <section id='packages' style={{ padding: '80px 32px 100px', background: 'white' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontFamily: "'Georgia', serif", fontSize: 40, fontWeight: 700, color: '#0f1f17', letterSpacing: '-0.02em', marginBottom: 48 }}>
          Packages
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px 28px' }}>
          {PACKAGES.map(pkg => <PackageCard key={pkg.title} pkg={pkg} onOpen={() => setSelected(pkg)} />)}
        </div>
      </div>
      {selected && <PackageModal pkg={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}

function PackageCard({ pkg, onOpen }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={onOpen} style={{ cursor: 'pointer' }}>
      <div style={{ width: '100%', paddingBottom: '68%', position: 'relative', borderRadius: 8, overflow: 'hidden', border: hov ? '2px solid #1a9e6b' : '2px solid transparent', transition: 'border-color 0.25s ease', boxSizing: 'border-box' }}>
        <img src={pkg.image} alt={pkg.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease', transform: hov ? 'scale(1.04)' : 'scale(1)' }} />
      </div>
      <div style={{ paddingTop: 16 }}>
        <h3 style={{ fontFamily: "'Georgia', serif", fontSize: 17, fontWeight: 700, color: '#0f1f17', marginBottom: 6, letterSpacing: '-0.01em' }}>{pkg.title}</h3>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, lineHeight: 1.65, color: '#6b7280' }}>{pkg.desc}</p>
        <span style={{ display: 'inline-block', marginTop: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: '#1a9e6b' }}>View plans →</span>
      </div>
    </div>
  );
}

function PackageModal({ pkg, onClose }) {
  const navigate = useNavigate();
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}
      onClick={onClose}>
      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }} />
      {/* Modal */}
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', background: 'white', borderRadius: 24, maxWidth: 680, width: '100%', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }}>
        {/* Header image */}
        <div style={{ position: 'relative', height: 200, overflow: 'hidden', borderRadius: '24px 24px 0 0' }}>
          <img src={pkg.image} alt={pkg.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
          <div style={{ position: 'absolute', bottom: 20, left: 28 }}>
            <h2 style={{ fontFamily: "'Georgia', serif", fontSize: 26, fontWeight: 700, color: 'white', margin: 0 }}>{pkg.title}</h2>
          </div>
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '28px 32px 32px' }}>
          {/* Overview */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontFamily: "'Georgia', serif", fontSize: 18, fontWeight: 700, color: '#0f1f17', marginBottom: 8 }}>{pkg.overview}</h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#6b7280', lineHeight: 1.7 }}>{pkg.overviewDesc}</p>
          </div>

          {/* Two columns: Who it's for + Results */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            <div style={{ background: '#f8faf9', borderRadius: 14, padding: '18px 20px' }}>
              <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: '#0f1f17', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Who it's for</h4>
              {pkg.forWhom.map(f => <div key={f} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#374151', marginBottom: 6, display: 'flex', gap: 8 }}><span style={{ color: '#1a9e6b', flexShrink: 0 }}>•</span>{f}</div>)}
            </div>
            <div style={{ background: '#f0fdf4', borderRadius: 14, padding: '18px 20px' }}>
              <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: '#0f1f17', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Expected Results</h4>
              {pkg.results.map(r => <div key={r} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#374151', marginBottom: 6, display: 'flex', gap: 8 }}><span style={{ color: '#1a9e6b', flexShrink: 0 }}>✓</span>{r}</div>)}
            </div>
          </div>

          {/* What's included */}
          <div style={{ marginBottom: 28 }}>
            <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: '#0f1f17', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>What's Included</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
              {pkg.includes.map(i => <div key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#374151', display: 'flex', gap: 8 }}><span style={{ color: '#1a9e6b' }}>✔</span>{i}</div>)}
            </div>
          </div>

          {/* Pricing plans */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: '#0f1f17', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Program Duration & Pricing</h4>
            <div style={{ display: 'flex', gap: 12 }}>
              {pkg.plans.map(plan => (
                <div key={plan.duration} style={{ flex: 1, border: '2px solid #e5e7eb', borderRadius: 14, padding: '16px', textAlign: 'center', transition: 'all 0.2s', cursor: 'default' }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#6b7280', marginBottom: 6 }}>{plan.duration}</div>
                  <div style={{ fontFamily: "'Georgia', serif", fontSize: 22, fontWeight: 700, color: '#0f1f17' }}>{plan.price}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button onClick={() => { onClose(); navigate('/signup'); }} style={{ width: '100%', fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700, color: 'white', background: 'linear-gradient(135deg, #1a9e6b 0%, #0d7a52 100%)', border: 'none', borderRadius: 100, padding: '15px', cursor: 'pointer', boxShadow: '0 6px 20px rgba(26,158,107,0.4)' }}>
            Select Plan — Book Consultation
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── About Doctors ────────────────────────────────────────────────────────────
function AboutDoctors() {
  const doctors = [
    {
      name: 'Dr. Ravi Kumar',
      creds: 'BNYS, PG Diploma in Acupuncture.',
      role: 'Co-Founder, Well Being Obesity and Pain Clinic',
      bio: 'Compassionate and dedicated Naturopathy Doctor with 25 years of experience in holistic healing. Skilled in diagnosing and treating patients using modern diagnostic tools, natural therapies, functional medicine, physical therapy, acupuncture, yoga, nutrition, and lifestyle management. Passionate about promoting wellness through a patient-centred approach and evidence-based natural therapies.',
      initials: 'RK',
    },
    {
      name: 'Dr. Parameswari',
      creds: 'BNYS, PG Diploma in Acupuncture.',
      role: 'Co-Founder, Well Being Obesity and Pain Clinic',
      bio: 'Dedicated and compassionate Doctor and Acupuncturist with over 25 years of experience treating chronic illnesses, managing pain, addressing stress disorders, and helping patients overcome lifestyle-related diseases through individualized treatment plans that combine naturopathy, acupuncture, physiotherapy, yoga, and diet therapy.',
      initials: 'DP',
    },
  ];

  return (
    <section id='doctors' style={{ padding: '80px 32px 90px', background: '#f8faf9' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{
          fontFamily: "'Georgia', serif", fontSize: 40, fontWeight: 700,
          color: '#0f1f17', letterSpacing: '-0.02em', marginBottom: 52,
        }}>
          About Doctors
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {doctors.map((doc, i) => (
            <DoctorCard key={doc.name} doc={doc} flipped={i % 2 !== 0} />
          ))}
        </div>
      </div>
    </section>
  );
}

function DoctorCard({ doc }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 36,
      background: 'white', borderRadius: 20, padding: '36px 40px',
      border: '1px solid #e5ede9',
      boxShadow: '0 2px 12px rgba(15,31,23,0.05)',
    }}>
      {/* Avatar */}
      <div style={{ flexShrink: 0 }}>
        <div style={{
          width: 88, height: 88, borderRadius: '50%',
          background: 'linear-gradient(135deg, #1a9e6b 0%, #0d7a52 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: 26, fontWeight: 800,
          fontFamily: "'Georgia', serif",
          boxShadow: '0 6px 20px rgba(26,158,107,0.3)',
        }}>{doc.initials}</div>
      </div>
      {/* Text */}
      <div style={{ flex: 1 }}>
        <h3 style={{
          fontFamily: "'Georgia', serif", fontSize: 24, fontWeight: 700,
          color: '#0f1f17', marginBottom: 4, letterSpacing: '-0.01em',
        }}>{doc.name}</h3>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
          color: '#1a9e6b', marginBottom: 2,
        }}>{doc.creds}</p>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 13,
          color: '#6b7280', marginBottom: 16, fontStyle: 'italic',
        }}>{doc.role}</p>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 15, lineHeight: 1.75,
          color: '#374151',
        }}>{doc.bio}</p>
      </div>
    </div>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function TestimonialsSection() {
  return (
    <section id='testimonials' style={{ padding: '72px 32px 80px', background: 'white' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{
          fontFamily: "'Georgia', serif", fontSize: 40, fontWeight: 700,
          color: '#0f1f17', letterSpacing: '-0.02em', marginBottom: 36,
        }}>Testimonials</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} style={{
              background: 'white', borderRadius: 12, padding: '28px 24px 24px',
              border: '1px solid #e5e7eb',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              minHeight: 200,
            }}>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 15, lineHeight: 1.72,
                color: '#111827', marginBottom: 28, flexGrow: 1,
              }}>"{t.quote}"</p>
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 2 }}>{t.name}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#9ca3af' }}>{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Contact Section ─────────────────────────────────────────────────────────
function ContactSection() {
  return (
    <section id='contact' style={{ padding: '72px 32px 64px', background: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{
          fontFamily: "'Georgia', serif", fontSize: 40, fontWeight: 700,
          color: '#0f1f17', letterSpacing: '-0.02em', marginBottom: 32,
        }}>Contact</h2>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 48, flexWrap: 'wrap' }}>
          {/* Left: clinic info */}
          <div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 800, color: '#c0392b', letterSpacing: '0.02em', marginBottom: 4 }}>
              WELL BEING LIFESTYLE &amp; PAIN CLINIC
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 24 }}>
              Healing through nature · Acupuncture · Yoga · Physiotherapy
            </p>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 15, marginTop: 1 }}>📍</span>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
                Indu Fortune Fields, The Annexe, KPHB Colony<br />
                Phase-13, Kukatpally Hyderabad, Telangana 500085
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 15 }}>📞</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: '#374151' }}>9849406028</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15 }}>🕐</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#374151' }}>Mon–Sat 9 AM – 8 PM</span>
            </div>
          </div>

          {/* Right: action buttons */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginTop: 8 }}>
            <a href="https://maps.google.com" target="_blank" rel="noreferrer" style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700,
              color: 'white', background: '#111827',
              padding: '14px 28px', borderRadius: 8, textDecoration: 'none',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#374151'}
            onMouseLeave={e => e.currentTarget.style.background = '#111827'}
            >Google maps</a>
            <a href="https://www.practo.com" target="_blank" rel="noreferrer" style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700,
              color: '#374151', background: '#e5e7eb',
              padding: '14px 28px', borderRadius: 8, textDecoration: 'none',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#d1d5db'}
            onMouseLeave={e => e.currentTarget.style.background = '#e5e7eb'}
            >Practo Link</a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const socials = [
    { label: 'Facebook',  href: '#', icon: (
      <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
    )},
    { label: 'LinkedIn',  href: '#', icon: (
      <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
    )},
    { label: 'YouTube',   href: '#', icon: (
      <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>
    )},
    { label: 'Instagram', href: '#', icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
    )},
  ];

  return (
    <footer style={{ background: 'white', borderTop: '1px solid #e5e7eb', padding: '28px 32px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#6b7280', marginBottom: 4 }}>
            © 2026 Well Being Clinic — All Rights Reserved
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#6b7280' }}>
            Designed by Pranav and Rohan
          </p>
        </div>
        <div style={{ display: 'flex', gap: 18 }}>
          {socials.map(s => (
            <SocialIcon key={s.label} href={s.href} label={s.label}>{s.icon}</SocialIcon>
          ))}
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ children, href, label }) {
  const [hov, setHov] = useState(false);
  return (
    <a href={href} aria-label={label} style={{
      color: hov ? '#1a9e6b' : '#9ca3af',
      transition: 'color 0.2s', display: 'flex', alignItems: 'center',
    }}
    onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {children}
    </a>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div>
      <NavBar scrolled={scrolled} />
      <HeroSection />
      <StatsBar />
      <PackagesSection />
      <AboutDoctors />
      <TestimonialsSection />
      <ContactSection />
      <Footer />
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wb_user')); } catch { return null; }
  });

  function handleLogin(userData) { setUser(userData); }
  function handleLogout() { setUser(null); }

  return (
    <BrowserRouter>
      <Chatbot />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login"  element={<Login  onLogin={handleLogin} />} />
        <Route path="/signup" element={<Signup onLogin={handleLogin} />} />
        <Route path="/patient" element={
          user?.role === 'patient'
            ? <PatientDashboard user={user} onLogout={handleLogout} />
            : <Login onLogin={handleLogin} />
        } />
        <Route path="/doctor" element={
          user?.role === 'doctor'
            ? <DoctorDashboard user={user} onLogout={handleLogout} />
            : <Login onLogin={handleLogin} />
        } />
      </Routes>
    </BrowserRouter>
  );
}