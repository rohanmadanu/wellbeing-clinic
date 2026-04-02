import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
function authHeaders() { return { headers: { Authorization: `Bearer ${localStorage.getItem('wb_token')}` } }; }

export default function CaseSheets({ user, patientId }) {
  const [sheets, setSheets]       = useState([]);
  const [uploading, setUploading] = useState(false);
  const [querying, setQuerying]   = useState(false);
  const [question, setQuestion]   = useState('');
  const [answer, setAnswer]       = useState(null);
  const [preview, setPreview]     = useState(null);
  const [dragOver, setDragOver]   = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const fileRef = useRef();
  const targetId = patientId || user?.id;

  useEffect(() => { fetchSheets(); }, [targetId]);

  async function fetchSheets() {
    try {
      const url = patientId ? `${API}/casesheets?patientId=${patientId}` : `${API}/casesheets`;
      const { data } = await axios.get(url, authHeaders());
      setSheets(data);
    } catch {}
  }

  async function handleUpload(file) {
    if (!file) return;
    const allowed = ['image/jpeg','image/jpg','image/png','image/webp','application/pdf'];
    if (!allowed.includes(file.type)) return setUploadMsg('error:Only images (JPG, PNG, WebP) and PDFs are supported.');
    if (file.size > 10 * 1024 * 1024) return setUploadMsg('error:File too large. Maximum size is 10MB.');

    setUploading(true);
    setUploadMsg('processing:Extracting text with OCR… this may take 15-30 seconds.');
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (patientId) formData.append('patientId', patientId);

      const { data } = await axios.post(`${API}/casesheets/upload`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('wb_token')}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadMsg(`success:✅ "${data.fileName}" processed! Extracted ${data.charCount} characters across ${data.chunkCount} searchable chunks.`);
      setPreview(data.preview);
      fetchSheets();
    } catch (err) {
      setUploadMsg(`error:${err.response?.data?.error || 'Upload failed. Please try again.'}`);
    } finally { setUploading(false); }
  }

  async function handleQuery(e) {
    e.preventDefault();
    if (!question.trim() || querying) return;
    setQuerying(true);
    setAnswer(null);
    try {
      const body = { question };
      if (patientId) body.patientId = patientId;
      const { data } = await axios.post(`${API}/casesheets/query`, body, authHeaders());
      setAnswer(data);
    } catch (err) {
      setAnswer({ answer: err.response?.data?.error || 'Query failed. Please try again.', sources: [] });
    } finally { setQuerying(false); }
  }

  async function deleteSheet(id) {
    if (!confirm('Delete this case sheet?')) return;
    try {
      await axios.delete(`${API}/casesheets/${id}`, authHeaders());
      setSheets(prev => prev.filter(s => s._id !== id));
    } catch {}
  }

  async function viewSheet(id) {
    try {
      const { data } = await axios.get(`${API}/casesheets/${id}`, authHeaders());
      setPreview(data.extractedText);
    } catch {}
  }

  const msgType = uploadMsg.split(':')[0];
  const msgText = uploadMsg.split(':').slice(1).join(':');

  const SUGGESTED = [
    'What medications is this patient currently on?',
    'What diagnoses have been recorded?',
    'What were the latest test results?',
    'Are there any allergies mentioned?',
    'What treatments have been prescribed?',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Upload zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files[0]); }}
        onClick={() => !uploading && fileRef.current?.click()}
        style={{ border: `2px dashed ${dragOver ? '#1a9e6b' : '#e5e7eb'}`, borderRadius: 16, padding: '32px', textAlign: 'center', cursor: uploading ? 'not-allowed' : 'pointer', background: dragOver ? '#f0fdf4' : '#f8faf9', transition: 'all 0.2s' }}
      >
        <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => handleUpload(e.target.files[0])} />
        <div style={{ fontSize: 36, marginBottom: 12 }}>{uploading ? '⏳' : '📄'}</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700, color: '#0f1f17', marginBottom: 6 }}>
          {uploading ? 'Processing with OCR…' : 'Upload Case Sheet'}
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#9ca3af' }}>
          {uploading ? 'Extracting and embedding text — please wait' : 'Drag & drop or click — JPG, PNG, WebP, PDF up to 10MB'}
        </div>
        {uploading && (
          <div style={{ marginTop: 16, height: 4, background: '#e5e7eb', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg, #1a9e6b, #0d7a52)', borderRadius: 100, animation: 'shimmer 1.5s infinite', width: '60%' }} />
          </div>
        )}
      </div>

      {/* Upload message */}
      {uploadMsg && (
        <div style={{ fontSize: 13, padding: '12px 16px', borderRadius: 12, background: msgType === 'success' ? '#f0fdf4' : msgType === 'error' ? '#fef2f2' : '#eff6ff', color: msgType === 'success' ? '#15803d' : msgType === 'error' ? '#dc2626' : '#1d4ed8', border: `1px solid ${msgType === 'success' ? '#bbf7d0' : msgType === 'error' ? '#fecaca' : '#bfdbfe'}` }}>
          {msgText}
        </div>
      )}

      {/* OCR Preview */}
      {preview && (
        <div style={{ background: '#f8faf9', borderRadius: 14, padding: '16px 20px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Extracted Text Preview</span>
            <button onClick={() => setPreview(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16 }}>×</button>
          </div>
          <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#374151', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{preview}</p>
        </div>
      )}

      {/* RAG Query */}
      {sheets.length > 0 && (
        <div style={{ background: 'white', borderRadius: 16, padding: '24px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontFamily: "'Georgia', serif", fontSize: 18, fontWeight: 700, color: '#0f1f17', marginBottom: 6 }}>🔍 Ask About Medical History</h3>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>AI searches through all uploaded case sheets to answer your question.</p>

          {/* Suggested questions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {SUGGESTED.map(q => (
              <button key={q} onClick={() => setQuestion(q)} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 100, padding: '5px 12px', cursor: 'pointer', color: '#0d7a52' }}>{q}</button>
            ))}
          </div>

          <form onSubmit={handleQuery} style={{ display: 'flex', gap: 10 }}>
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="e.g. What medications is this patient on?"
              style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '11px 16px', borderRadius: 12, border: '1.5px solid #e5e7eb', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#1a9e6b'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
            <button type="submit" disabled={!question.trim() || querying} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: 'white', background: querying || !question.trim() ? '#9ca3af' : 'linear-gradient(135deg, #1a9e6b, #0d7a52)', border: 'none', borderRadius: 12, padding: '11px 20px', cursor: querying || !question.trim() ? 'not-allowed' : 'pointer' }}>
              {querying ? '⏳ Searching…' : '🔍 Ask'}
            </button>
          </form>

          {/* Answer */}
          {answer && (
            <div style={{ marginTop: 16, background: '#f8faf9', borderRadius: 14, padding: '18px 20px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: '#0f1f17', marginBottom: 10 }}>🤖 AI Answer</div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{answer.answer}</p>
              {answer.sources?.length > 0 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sources: </span>
                  {answer.sources.map((s, i) => (
                    <span key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#6b7280', marginLeft: 6 }}>📄 {s.file}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Case sheets list */}
      <div>
        <h3 style={{ fontFamily: "'Georgia', serif", fontSize: 18, fontWeight: 700, color: '#0f1f17', marginBottom: 16 }}>
          Uploaded Documents ({sheets.length})
        </h3>
        {sheets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', background: '#f8faf9', borderRadius: 16, border: '1px dashed #e5e7eb' }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#9ca3af' }}>No case sheets uploaded yet. Upload your first document above.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sheets.map(s => (
              <div key={s._id} style={{ background: 'white', borderRadius: 14, padding: '16px 20px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 24 }}>{s.fileType?.includes('pdf') ? '📑' : '🖼️'}</span>
                  <div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, color: '#0f1f17' }}>{s.fileName}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                      Uploaded {new Date(s.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · by {s.uploadedBy}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => viewSheet(s._id)} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 100, padding: '6px 14px', cursor: 'pointer' }}>View Text</button>
                  <button onClick={() => deleteSheet(s._id)} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 100, padding: '6px 14px', cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}