import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Login() {
  const [activeTab, setActiveTab] = useState('login');
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.user, res.data.token);
      navigate(res.data.user.role === 'professional' ? '/pro' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Email ou mot de passe incorrect');
    } finally { setLoading(false); }
  };

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus { border-color: #e8648c !important; outline: none; }
        .pink-btn:hover { background: #d4547a !important; }
      `}</style>

      {/* GAUCHE — déco */}
      <div style={S.leftPanel}>
        <div style={S.leftInner}>
          <div style={S.leftLogo}>Presta<span style={{ color: '#e8648c' }}>&</span>You</div>
          <div style={S.leftTagline}>Prestation sur rendez-vous</div>
          <div style={S.leftImgBox}>
            <div style={{ fontSize: 80, marginBottom: 16 }}>💄</div>
            <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>Sublimez votre beauté</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 8, fontFamily: 'DM Sans' }}>Réservez en toute simplicité</div>
          </div>
        </div>
      </div>

      {/* DROITE — formulaire */}
      <div style={S.rightPanel}>
        <div style={S.card}>
          <div style={S.cardTitle}>Bienvenue ! <span style={{ color: '#e8648c' }}>♥</span></div>
          <div style={S.cardSub}>Connectez-vous pour gérer<br />vos rendez-vous en toute simplicité.</div>

          {/* Tabs */}
          <div style={S.tabs}>
            <button style={{ ...S.tab, ...(activeTab === 'login' ? S.tabActive : {}) }}
              onClick={() => setActiveTab('login')}>Connexion</button>
            <button style={{ ...S.tab, ...(activeTab === 'register' ? S.tabActive : {}) }}
              onClick={() => navigate('/register')}>Créer un compte</button>
          </div>

          {error && <div style={S.error}>{error}</div>}

          <div style={S.formGroup}>
            <label style={S.label}>Email</label>
            <input style={S.input} type="email" placeholder="votre@email.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>

          <div style={S.formGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={S.label}>Mot de passe</label>
              <span style={S.forgot}>Mot de passe oublié ?</span>
            </div>
            <div style={{ position: 'relative' }}>
              <input style={S.input} type="password" placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>
          </div>

          <button className="pink-btn" style={{ ...S.submitBtn, opacity: loading ? 0.7 : 1 }}
            onClick={handleSubmit} disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>

          <div style={S.orDivider}>
            <div style={S.orLine} /><span style={S.orText}>ou continuer avec</span><div style={S.orLine} />
          </div>

          <div style={S.socialRow}>
            <button style={S.socialBtn} 
              onClick={() => window.location.href = `http://localhost:5000/api/auth/google`}> 
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
           </button>
             {/*<button style={{ ...S.socialBtn, opacity: 0.5, cursor: 'not-allowed' }}
              title="Apple Sign In nécessite un compte Apple Developer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#000">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                 </svg>
                 Apple
             </button>*/}
          </div>

          <p style={S.terms}>
            En vous connectant, vous acceptez nos{' '}
            <span style={{ color: '#e8648c' }}>Conditions d'utilisation</span> et notre{' '}
            <span style={{ color: '#e8648c' }}>Politique de confidentialité</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

const S = {
  page: { display: 'flex', minHeight: '100vh', fontFamily: "'Cormorant Garamond', Georgia, serif" },
  leftPanel: { flex: 1, background: 'linear-gradient(160deg, #1a1a1a 0%, #2d1520 50%, #1a1a1a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  leftInner: { textAlign: 'center', position: 'relative', zIndex: 1 },
  leftLogo: { fontSize: 36, fontWeight: 700, color: 'white', marginBottom: 4 },
  leftTagline: { fontSize: 14, color: 'rgba(255,255,255,0.5)', fontFamily: 'DM Sans', marginBottom: 48 },
  leftImgBox: { width: 280, height: 280, borderRadius: 24, background: 'linear-gradient(135deg, rgba(232,100,140,0.3), rgba(232,100,140,0.1))', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(232,100,140,0.2)' },
  rightPanel: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff9f9', padding: 40 },
  card: { background: 'white', borderRadius: 24, padding: '40px 36px', width: '100%', maxWidth: 420, boxShadow: '0 8px 40px rgba(232,100,140,0.1)', border: '1px solid #fce4ec' },
  cardTitle: { fontSize: 30, fontWeight: 700, color: '#1a1a1a', marginBottom: 6, textAlign: 'center' },
  cardSub: { fontSize: 14, color: '#888', fontFamily: 'DM Sans', textAlign: 'center', marginBottom: 24, lineHeight: 1.6 },
  tabs: { display: 'flex', background: '#fce4ec', borderRadius: 50, padding: 4, marginBottom: 24 },
  tab: { flex: 1, padding: '9px', border: 'none', borderRadius: 50, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans', background: 'transparent', color: '#888', transition: 'all 0.2s' },
  tabActive: { background: 'white', color: '#e8648c', boxShadow: '0 2px 8px rgba(232,100,140,0.15)' },
  error: { background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 13, fontFamily: 'DM Sans' },
  formGroup: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 6, fontFamily: 'DM Sans' },
  input: { width: '100%', padding: '13px 16px', border: '1.5px solid #fce4ec', borderRadius: 12, fontSize: 14, fontFamily: 'DM Sans', color: '#1a1a1a', background: '#fff9f9', transition: 'border-color 0.2s' },
  forgot: { fontSize: 12, color: '#e8648c', fontFamily: 'DM Sans', cursor: 'pointer', fontWeight: 600 },
  submitBtn: { width: '100%', padding: '14px', background: '#1a1a1a', color: 'white', border: 'none', borderRadius: 50, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans', marginTop: 8, marginBottom: 20, transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' },
  orDivider: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  orLine: { flex: 1, height: 1, background: '#fce4ec' },
  orText: { fontSize: 12, color: '#bbb', fontFamily: 'DM Sans', whiteSpace: 'nowrap' },
  socialRow: { display: 'flex', gap: 12, marginBottom: 20 },
  socialBtn: { flex: 1, padding: '11px', background: 'white', border: '1.5px solid #eee', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#333' },
  terms: { fontSize: 11, color: '#bbb', fontFamily: 'DM Sans', textAlign: 'center', lineHeight: 1.6 },
};
