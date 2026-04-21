import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'client' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError('');
    try {
      const res = await api.post('/auth/register', form);
      login(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur inscription');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Créer un compte</h2>
        {error && <div style={styles.error}>{error}</div>}
        <input style={styles.input} placeholder="Nom complet"
          value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input style={styles.input} placeholder="Email" type="email"
          value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <input style={styles.input} placeholder="Mot de passe" type="password"
          value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        <select style={styles.input} value={form.role}
          onChange={e => setForm({ ...form, role: e.target.value })}>
          <option value="client">Je suis un client</option>
          <option value="professional">Je suis un professionnel</option>
        </select>
        <button style={styles.btn} onClick={handleSubmit}>S'inscrire</button>
        <p style={styles.link}>Déjà un compte ? <Link to="/login">Se connecter</Link></p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f7fb' },
  card: { background: 'white', padding: 40, borderRadius: 16, width: 380, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  title: { fontSize: 24, fontWeight: 700, color: '#1a3c5e', marginBottom: 24, textAlign: 'center' },
  input: { width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, marginBottom: 14, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' },
  btn: { width: '100%', padding: 14, background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  error: { background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 },
  link: { textAlign: 'center', marginTop: 16, fontSize: 14, color: '#64748b' }
};