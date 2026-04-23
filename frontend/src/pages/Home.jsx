import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Home() {
  const [professionals, setProfessionals] = useState([]);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const navigate = useNavigate();

  const fetchPros = async () => {
    try {
      const res = await api.get('/professionals', {
        params: { name: search, city }
      });
      setProfessionals(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchPros(); }, []);

  return (
    <div style={{ background: '#f4f7fb', minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #000000ff, #66696aff)', padding: '48px 24px', textAlign: 'center' }}>
        <h1 style={{ color: 'white', fontSize: 36, marginBottom: 8 }}>Prestatio</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 28 }}>Trouvez un prestataire et réservez en ligne</p>
        <div style={{ display: 'flex', gap: 10, maxWidth: 600, margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
          <input style={styles.searchInput} placeholder="🔍 Prestataires..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <input style={styles.searchInput} placeholder="📍 Ville"
            value={city} onChange={e => setCity(e.target.value)} />
          <button style={styles.searchBtn} onClick={fetchPros}>Rechercher</button>
        </div>
      </div>

      {/* Liste */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <h2 style={{ fontSize: 18, color: '#1a3c5e', marginBottom: 20 }}>
          Prestataires disponibles — {professionals.length} résultat{professionals.length > 1 ? 's' : ''}
        </h2>
        {professionals.length === 0 ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>Aucun prestataire trouvé.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {professionals.map(pro => (
              <div key={pro.id} style={styles.card} onClick={() => navigate(`/professional/${pro.id}`)}>
                <div style={{ ...styles.avatar, background: '#0ea5e9' }}>
                  {pro.name?.charAt(0).toUpperCase()}
                </div>
                <div style={styles.proName}>{pro.name}</div>
                <div style={styles.proSpecialty}>{pro.specialty}</div>
                <div style={styles.proCity}>📍 {pro.city}</div>
                {pro.address && <div style={styles.proAddress}>{pro.address}</div>}
                <button style={styles.bookBtn}>Voir les créneaux →</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  searchInput: { flex: 1, minWidth: 180, padding: '12px 16px', borderRadius: 10, border: 'none', fontSize: 14, fontFamily: 'inherit', outline: 'none' },
  searchBtn: { padding: '12px 24px', background: '#000000ff', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  card: { background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid #e8edf5' },
  avatar: { width: 52, height: 52, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 14 },
  proName: { fontSize: 16, fontWeight: 700, color: '#1a3c5e', marginBottom: 4 },
  proSpecialty: { fontSize: 13, color: '#0ea5e9', fontWeight: 600, marginBottom: 8 },
  proCity: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  proAddress: { fontSize: 12, color: '#94a3b8', marginBottom: 14 },
  bookBtn: { width: '100%', padding: '10px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }
};