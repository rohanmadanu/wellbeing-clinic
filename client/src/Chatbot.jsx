import { useState, useRef, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const SUGGESTED_QUESTIONS = [
  'Which package is right for me?',
  'How much does the Weight Loss program cost?',
  'What does the Detox package include?',
  'What are your clinic timings?',
  'How do I book an appointment?',
];

export default function Chatbot() {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hi! I\'m the Well Being Clinic assistant. I can help you find the right wellness package, answer questions about our treatments, or guide you to book a consultation. How can I help you today?',
    },
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  async function sendMessage(text) {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    setShowSuggestions(false);
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history: messages }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, I\'m having trouble connecting. Please try again in a moment.' }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  return (
    <>
      {/* Floating bubble */}
      <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999 }}>
        {/* Notification dot when closed */}
        {!open && (
          <div style={{ position: 'absolute', top: -2, right: -2, width: 14, height: 14, background: '#ef4444', borderRadius: '50%', border: '2px solid white', zIndex: 1 }} />
        )}
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            width: 58, height: 58, borderRadius: '50%',
            background: 'linear-gradient(135deg, #1a9e6b 0%, #0d7a52 100%)',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 8px 28px rgba(26,158,107,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            transform: open ? 'scale(0.9) rotate(90deg)' : 'scale(1)',
          }}
        >
          {open
            ? <span style={{ fontSize: 22, color: 'white' }}>✕</span>
            : <span style={{ fontSize: 26 }}>💬</span>
          }
        </button>
      </div>

      {/* Chat window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 100, right: 28, zIndex: 9998,
          width: 380, height: 540,
          background: 'white', borderRadius: 24,
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: 'chatSlideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          fontFamily: "'DM Sans', sans-serif",
        }}>

          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #0f1f17 0%, #1a3d2b 100%)', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #1a9e6b, #0d7a52)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🌿</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'white' }}>Well Being Assistant</div>
              <div style={{ fontSize: 11, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                Online now
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.role === 'assistant' && (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #1a9e6b, #0d7a52)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0, marginRight: 8, marginTop: 2 }}>🌿</div>
                )}
                <div style={{
                  maxWidth: '78%', padding: '10px 14px', borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: m.role === 'user' ? 'linear-gradient(135deg, #1a9e6b, #0d7a52)' : '#f3f4f6',
                  color: m.role === 'user' ? 'white' : '#1f2937',
                  fontSize: 13, lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}>
                  {m.text}
                </div>
              </div>
            ))}

            {/* Suggested questions — shown only at start */}
            {showSuggestions && messages.length === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                {SUGGESTED_QUESTIONS.map(q => (
                  <button key={q} onClick={() => sendMessage(q)} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, textAlign: 'left', background: 'white', border: '1.5px solid #d1fae5', borderRadius: 100, padding: '7px 14px', cursor: 'pointer', color: '#0d7a52', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.target.style.background = '#f0fdf4'; e.target.style.borderColor = '#1a9e6b'; }}
                    onMouseLeave={e => { e.target.style.background = 'white'; e.target.style.borderColor = '#d1fae5'; }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #1a9e6b, #0d7a52)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🌿</div>
                <div style={{ background: '#f3f4f6', borderRadius: '18px 18px 18px 4px', padding: '12px 16px', display: 'flex', gap: 4 }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#9ca3af', animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about packages, pricing, doctors…"
              rows={1}
              style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '10px 14px', borderRadius: 20, border: '1.5px solid #e5e7eb', outline: 'none', resize: 'none', lineHeight: 1.5, maxHeight: 80, overflowY: 'auto' }}
              onFocus={e => e.target.style.borderColor = '#1a9e6b'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{ width: 40, height: 40, borderRadius: '50%', background: input.trim() && !loading ? 'linear-gradient(135deg, #1a9e6b, #0d7a52)' : '#e5e7eb', border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}
            >
              <span style={{ fontSize: 16, transform: 'rotate(90deg)', display: 'block', color: input.trim() && !loading ? 'white' : '#9ca3af' }}>▲</span>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
      `}</style>
    </>
  );
}