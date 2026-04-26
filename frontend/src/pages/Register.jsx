import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'client' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError('');
    if (!form.name || !form.email || !form.password) { setError('Tous les champs sont obligatoires.'); return; }
    if (form.password.length < 6) { setError('Le mot de passe doit faire au moins 6 caractères.'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      login(res.data.user, res.data.token);
      navigate(res.data.user.role === 'professional' ? '/pro' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'inscription");
    } finally { setLoading(false); }
  };

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus { border-color: #e8648c !important; outline: none; }
      `}</style>

      <div style={S.leftPanel}>
        <div style={S.leftInner}>
          <div style={S.leftLogo} onClick={() => navigate('/')}>Presta<span style={{ color: '#e8648c' }}>&</span>You</div>
          <div style={S.leftTagline}>Beauté sur rendez-vous</div>
          <div style={S.leftImgBox}>
            <div style={{ fontSize: 72, marginBottom: 12 }}>✨</div>
            <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>Rejoignez notre communauté</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 8, fontFamily: 'DM Sans', lineHeight: 1.6 }}>
              +10 000 clientes<br />nous font confiance
            </div>
          </div>
        </div>
      </div>

      <div style={S.rightPanel}>
        <div style={S.card}>
          <div style={S.backLink} onClick={() => navigate('/login')}>← Retour à la connexion</div>
          <div style={S.cardTitle}>Créer un compte <span style={{ color: '#e8648c' }}>✨</span></div>
          <div style={S.cardSub}>Rejoignez Presta&You et réservez pour vos évênements vos prestations en ligne.</div>

          {error && <div style={S.error}>{error}</div>}

          <div style={S.formGroup}>
            <label style={S.label}>Nom complet</label>
            <input style={S.input} placeholder="Emma Dupont"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>Email</label>
            <input style={S.input} type="email" placeholder="votre@email.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>Mot de passe</label>
            <input style={S.input} type="password" placeholder="6 caractères minimum"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>

          <div style={S.formGroup}>
            <label style={S.label}>Je suis...</label>
            <div style={S.roleRow}>
              <button style={{ ...S.roleBtn, ...(form.role === 'client' ? S.roleBtnActive : {}) }}
                onClick={() => setForm({ ...form, role: 'client' })}>
                <span style={{ fontSize: 20 }}>👤</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Une cliente</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>Je réserve des prestations</div>
                </div>
              </button>
              <button style={{ ...S.roleBtn, ...(form.role === 'professional' ? S.roleBtnActive : {}) }}
                onClick={() => setForm({ ...form, role: 'professional' })}>
                <span style={{ fontSize: 20 }}>💼</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Une professionnelle</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>Je propose des prestations</div>
                </div>
              </button>
            </div>
          </div>

          {form.role === 'professional' && (
            <div style={S.proNote}>
              💡 Après inscription, vous pourrez compléter votre profil et ajouter vos prestations dans votre espace professionnel.
            </div>
          )}

          <button style={{ ...S.submitBtn, opacity: loading ? 0.7 : 1 }}
            onClick={handleSubmit} disabled={loading}>
            {loading ? 'Inscription...' : 'Créer mon compte'}
          </button>

          <p style={S.terms}>
            En créant un compte, vous acceptez nos{' '}
            <span style={{ color: '#e8648c' }}>CGU</span> et notre{' '}
            <span style={{ color: '#e8648c' }}>Politique de confidentialité</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

const S = {
  page: { display: 'flex', minHeight: '100vh', fontFamily: "'Cormorant Garamond', Georgia, serif" },
  leftPanel: { flex: 1, background: 'linear-gradient(160deg, #1a1a1a 0%, #2d1520 50%, #1a1a1a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  leftInner: { textAlign: 'center' },
  leftLogo: { fontSize: 36, fontWeight: 700, color: 'white', marginBottom: 4, cursor: 'pointer' },
  leftTagline: { fontSize: 14, color: 'rgba(255,255,255,0.5)', fontFamily: 'DM Sans', marginBottom: 48 },
  leftImgBox: { width: 280, height: 260, borderRadius: 24, background: 'linear-gradient(135deg, rgba(232,100,140,0.3), rgba(232,100,140,0.1))', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(232,100,140,0.2)', textAlign: 'center', padding: 24 },
  rightPanel: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff9f9', padding: 40 },
  card: { background: 'white', borderRadius: 24, padding: '36px', width: '100%', maxWidth: 460, boxShadow: '0 8px 40px rgba(232,100,140,0.1)', border: '1px solid #fce4ec' },
  backLink: { fontSize: 13, color: '#e8648c', fontFamily: 'DM Sans', cursor: 'pointer', fontWeight: 600, marginBottom: 20, display: 'block' },
  cardTitle: { fontSize: 28, fontWeight: 700, color: '#1a1a1a', marginBottom: 6, textAlign: 'center' },
  cardSub: { fontSize: 13, color: '#888', fontFamily: 'DM Sans', textAlign: 'center', marginBottom: 24, lineHeight: 1.6 },
  error: { background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 13, fontFamily: 'DM Sans' },
  formGroup: { marginBottom: 14 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 6, fontFamily: 'DM Sans' },
  input: { width: '100%', padding: '13px 16px', border: '1.5px solid #fce4ec', borderRadius: 12, fontSize: 14, fontFamily: 'DM Sans', color: '#1a1a1a', background: '#fff9f9', transition: 'border-color 0.2s' },
  roleRow: { display: 'flex', gap: 10 },
  roleBtn: { flex: 1, padding: '14px 12px', border: '1.5px solid #fce4ec', borderRadius: 14, background: 'white', cursor: 'pointer', fontFamily: 'DM Sans', color: '#666', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s', textAlign: 'left' },
  roleBtnActive: { background: '#fff0f4', borderColor: '#e8648c', color: '#1a1a1a' },
  proNote: { background: '#fff0f4', border: '1px solid #fce4ec', borderRadius: 12, padding: '12px 14px', fontSize: 13, color: '#c2185b', fontFamily: 'DM Sans', marginBottom: 14, lineHeight: 1.5 },
  submitBtn: { width: '100%', padding: '14px', background: '#1a1a1a', color: 'white', border: 'none', borderRadius: 50, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans', marginTop: 8, marginBottom: 16, transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' },
  terms: { fontSize: 11, color: '#bbb', fontFamily: 'DM Sans', textAlign: 'center', lineHeight: 1.6 },
};
