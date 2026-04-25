import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Home() {
  const [professionals, setProfessionals] = useState([]);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const navigate = useNavigate();

  const fetchPros = useCallback(async () => {
    try {
      const res = await api.get('/professionals', {
        params: { name: search, city }
      });
      setProfessionals(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [search, city]);

  useEffect(() => {
  fetchPros(null, null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  return (
    <div style={{ background: '#f4f7fb', minHeight: '100vh' }}>
      <div style={{ padding: 48, textAlign: 'center' }}>
        <h1>Prestatio</h1>

        <input
          placeholder="Prestataires"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          placeholder="Ville"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />

        <button onClick={fetchPros}>Rechercher</button>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {professionals.map(pro => (
          <div key={pro.id} onClick={() => navigate(`/professional/${pro.id}`)}>
            <h3>{pro.name}</h3>
            <p>{pro.specialty}</p>
            <p>{pro.city}</p>
          </div>
        ))}
      </div>
    </div>
  );
}