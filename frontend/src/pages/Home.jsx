import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Home() {
  const [professionals, setProfessionals] = useState([]);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [radius, setRadius] = useState(10);
  const [useGeo, setUseGeo] = useState(false);
  const navigate = useNavigate();

  const fetchPros = useCallback(async (lat, lng) => {
    try {
      const params = { name: search, city };
      if (useGeo && lat && lng) {
        params.lat = lat;
        params.lng = lng;
        params.radius = radius;
      }
      const res = await api.get('/professionals', { params });
      setProfessionals(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [search, city, useGeo, radius]);

  useEffect(() => {
    fetchPros(null, null);
  }, [fetchPros]);

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      alert('Géolocalisation non supportée par votre navigateur.');
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setUseGeo(true);
        setLocationLoading(false);
        fetchPros(latitude, longitude);
      },
      () => {
        alert('Impossible de récupérer votre position.');
        setLocationLoading(false);
      }
    );
  };

  return (
    <div style={{ background: '#f4f7fb', minHeight: '100vh' }}>
      <div style={{ background: 'linear-gradient(135deg, #1a3c5e, #0ea5e9)', padding: '48px 24px', textAlign: 'center' }}>
        <h1 style={{ color: 'white', fontSize: 36, marginBottom: 8 }}>Réservio</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 28 }}>Trouvez un professionnel près de chez vous</p>

        <div style={{ display: 'flex', gap: 10, maxWidth: 700, margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
          <input style={styles.searchInput} placeholder="🔍 Nom ou spécialité..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <input style={styles.searchInput} placeholder="📍 Ville"
            value={city} onChange={e => setCity(e.target.value)} />
          <button style={styles.searchBtn} onClick={() => fetchPros(userLocation?.lat, userLocation?.lng)}>
            Rechercher
          </button>
          <button
            style={{ ...styles.searchBtn, background: useGeo ? '#16a34a' : '#0284c7', minWidth: 180 }}
            onClick={handleGeolocate}
            disabled={locationLoading}
          >
            {locationLoading ? '⏳ Localisation...' : useGeo ? '✅ Autour de moi' : '📍 Me localiser'}
          </button>
        </div>

        {useGeo && (
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>Rayon :</span>
            {[5, 10, 20, 50].map(r => (
              <button key={r}
                style={{ padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                  background: radius === r ? 'white' : 'rgba(255,255,255,0.2)',
                  color: radius === r ? '#1a3c5e' : 'white' }}
                onClick={() => { setRadius(r); fetchPros(userLocation?.lat, userLocation?.lng); }}
              >{r} km</button>
            ))}
          </div>
        )}
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
        <h2 style={{ fontSize: 18, color: '#1a3c5e', marginBottom: 20 }}>
          {useGeo ? `📍 Professionnels dans un rayon de ${radius} km` : 'Professionnels disponibles'}
          <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: 15 }}>
            {' '}— {professionals.length} résultat{professionals.length > 1 ? 's' : ''}
          </span>
        </h2>

        {professionals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>😕</div>
            <p>Aucun professionnel trouvé.{useGeo ? ' Essayez d\'augmenter le rayon.' : ''}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {professionals.map(pro => (
              <div key={pro.id} style={styles.card} onClick={() => navigate(`/professional/${pro.id}`)}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={styles.avatar}>{pro.name?.charAt(0).toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.proName}>{pro.name}</div>
                    <div style={styles.proSpecialty}>{pro.specialty}</div>
                    {pro.average_rating && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <span style={{ color: '#f59e0b', fontSize: 13 }}>
                          {'★'.repeat(Math.round(pro.average_rating))}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1a3c5e' }}>
                          {parseFloat(pro.average_rating).toFixed(1)}
                        </span>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>({pro.review_count} avis)</span>
                      </div>
                    )}
                  </div>
                </div>
                <div style={styles.proCity}>📍 {pro.city}{pro.address ? ` · ${pro.address}` : ''}</div>
                <button style={styles.bookBtn}>Voir la fiche →</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  searchInput: { flex: 1, minWidth: 160, padding: '12px 16px', borderRadius: 10, border: 'none', fontSize: 14, fontFamily: 'inherit', outline: 'none' },
  searchBtn: { padding: '12px 24px', background: '#0284c7', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  card: { background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', cursor: 'pointer', border: '1px solid #e8edf5' },
  avatar: { width: 48, height: 48, borderRadius: 12, background: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'white', flexShrink: 0 },
  proName: { fontSize: 15, fontWeight: 700, color: '#1a3c5e', marginBottom: 2 },
  proSpecialty: { fontSize: 13, color: '#0ea5e9', fontWeight: 600 },
  proCity: { fontSize: 13, color: '#64748b', marginBottom: 14 },
  bookBtn: { width: '100%', padding: 10, background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
};