import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Professional() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [pro, setPro] = useState(null);
  const [availabilities, setAvailabilities] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');
  const [step, setStep] = useState('slots'); // slots | confirm | success
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [proRes, slotsRes] = await Promise.all([
          api.get(`/professionals/${id}`),
          api.get(`/availabilities/${id}`)
        ]);
        setPro(proRes.data);
        setAvailabilities(slotsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Grouper les créneaux par date
  const slotsByDate = availabilities.reduce((acc, slot) => {
    const date = slot.date.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {});

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long'
    });
  };

  const formatTime = (timeStr) => timeStr?.slice(0, 5);

  const handleBook = async () => {
    if (!user) { navigate('/login'); return; }
    setError('');
    try {
      await api.post('/appointments', {
        professional_id: parseInt(id),
        availability_id: selectedSlot.id,
        reason
      });
      setStep('success');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la réservation');
    }
  };

  if (loading) return (
    <div style={styles.loading}>Chargement...</div>
  );

  if (!pro) return (
    <div style={styles.loading}>Professionnel introuvable.</div>
  );

  return (
    <div style={{ background: '#f4f7fb', minHeight: '100vh' }}>

      {/* Navbar */}
      <nav style={styles.navbar}>
        <span style={styles.logo} onClick={() => navigate('/')}>← Réservio</span>
        {user ? (
          <span style={styles.navUser}>👤 {user.name}</span>
        ) : (
          <button style={styles.navBtn} onClick={() => navigate('/login')}>Connexion</button>
        )}
      </nav>

      <div style={styles.container}>

        {/* Profil card */}
        <div style={styles.profileCard}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={styles.avatar}>{pro.name?.charAt(0).toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <h1 style={styles.proName}>{pro.name}</h1>
              <div style={styles.proSpecialty}>{pro.specialty}</div>
              <div style={styles.proMeta}>
                <span>📍 {pro.city}</span>
                {pro.address && <span> · {pro.address}</span>}
              </div>
              {pro.bio && <p style={styles.proBio}>{pro.bio}</p>}
            </div>
          </div>
        </div>

        <div style={styles.grid}>

          {/* Créneaux */}
          <div style={styles.slotsSection}>
            <h2 style={styles.sectionTitle}>📅 Disponibilités</h2>

            {Object.keys(slotsByDate).length === 0 ? (
              <div style={styles.noSlots}>
                Aucun créneau disponible pour le moment.
              </div>
            ) : (
              Object.entries(slotsByDate).map(([date, slots]) => (
                <div key={date} style={styles.dateGroup}>
                  <div style={styles.dateLabel}>{formatDate(date)}</div>
                  <div style={styles.slotsGrid}>
                    {slots.map(slot => (
                      <button
                        key={slot.id}
                        style={{
                          ...styles.slotBtn,
                          ...(selectedSlot?.id === slot.id ? styles.slotBtnActive : {})
                        }}
                        onClick={() => {
                          setSelectedSlot(slot);
                          setStep('slots');
                          setError('');
                        }}
                      >
                        {formatTime(slot.start_time)}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Panneau de réservation */}
          <div style={styles.bookingPanel}>

            {step === 'success' ? (
              <div style={styles.successBox}>
                <div style={styles.successIcon}>✓</div>
                <h3 style={styles.successTitle}>Rendez-vous confirmé !</h3>
                <p style={styles.successText}>
                  Votre RDV avec <strong>{pro.name}</strong> est confirmé
                  pour le <strong>{formatDate(selectedSlot?.date?.split('T')[0])}</strong>
                  {' '}à <strong>{formatTime(selectedSlot?.start_time)}</strong>.
                </p>
                <button style={styles.confirmBtn} onClick={() => navigate('/dashboard')}>
                  Voir mes rendez-vous
                </button>
                <button style={{ ...styles.confirmBtn, background: '#f1f5f9', color: '#1a3c5e', marginTop: 10 }}
                  onClick={() => navigate('/')}>
                  Retour à l'accueil
                </button>
              </div>

            ) : selectedSlot ? (
              <div>
                <h3 style={styles.panelTitle}>Confirmer le rendez-vous</h3>

                {/* Récap */}
                <div style={styles.recap}>
                  <div style={styles.recapRow}>
                    <span style={styles.recapLabel}>Professionnel</span>
                    <span style={styles.recapValue}>{pro.name}</span>
                  </div>
                  <div style={styles.recapRow}>
                    <span style={styles.recapLabel}>Date</span>
                    <span style={styles.recapValue}>{formatDate(selectedSlot.date?.split('T')[0])}</span>
                  </div>
                  <div style={styles.recapRow}>
                    <span style={styles.recapLabel}>Heure</span>
                    <span style={styles.recapValue}>{formatTime(selectedSlot.start_time)}</span>
                  </div>
                  <div style={styles.recapRow}>
                    <span style={styles.recapLabel}>Lieu</span>
                    <span style={styles.recapValue}>{pro.city}</span>
                  </div>
                </div>

                {/* Motif */}
                <div style={{ marginBottom: 16 }}>
                  <label style={styles.label}>Motif (optionnel)</label>
                  <textarea
                    style={styles.textarea}
                    placeholder="Décrivez votre demande..."
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                  />
                </div>

                {error && <div style={styles.errorBox}>{error}</div>}

                {!user ? (
                  <div>
                    <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
                      Vous devez être connecté pour réserver.
                    </p>
                    <button style={styles.confirmBtn} onClick={() => navigate('/login')}>
                      Se connecter pour réserver
                    </button>
                  </div>
                ) : (
                  <button style={styles.confirmBtn} onClick={handleBook}>
                    ✓ Confirmer le rendez-vous
                  </button>
                )}

                <button
                  style={styles.cancelBtn}
                  onClick={() => setSelectedSlot(null)}
                >
                  Annuler
                </button>
              </div>

            ) : (
              <div style={styles.emptyPanel}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
                <p style={{ color: '#64748b', fontSize: 14 }}>
                  Sélectionnez un créneau disponible pour réserver.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: 16, color: '#64748b' },
  navbar: { background: 'white', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e8edf5', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' },
  logo: { fontSize: 18, fontWeight: 700, color: '#1a3c5e', cursor: 'pointer' },
  navUser: { fontSize: 14, color: '#64748b', fontWeight: 500 },
  navBtn: { padding: '8px 18px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  container: { maxWidth: 960, margin: '0 auto', padding: '32px 24px' },
  profileCard: { background: 'white', borderRadius: 16, padding: 28, marginBottom: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e8edf5' },
  avatar: { width: 72, height: 72, borderRadius: 16, background: 'linear-gradient(135deg, #0ea5e9, #1a3c5e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: 'white', flexShrink: 0 },
  proName: { fontSize: 24, fontWeight: 700, color: '#1a3c5e', marginBottom: 4 },
  proSpecialty: { fontSize: 15, color: '#0ea5e9', fontWeight: 600, marginBottom: 8 },
  proMeta: { fontSize: 14, color: '#64748b', marginBottom: 10 },
  proBio: { fontSize: 14, color: '#475569', lineHeight: 1.6, marginTop: 10 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' },
  slotsSection: { background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e8edf5' },
  sectionTitle: { fontSize: 17, fontWeight: 700, color: '#1a3c5e', marginBottom: 20 },
  noSlots: { textAlign: 'center', padding: '40px 20px', color: '#94a3b8', fontSize: 14 },
  dateGroup: { marginBottom: 24 },
  dateLabel: { fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'capitalize', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #f1f5f9' },
  slotsGrid: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  slotBtn: { padding: '10px 16px', border: '1.5px solid #e2e8f0', borderRadius: 10, background: 'white', fontSize: 14, fontWeight: 600, color: '#1a3c5e', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' },
  slotBtnActive: { background: '#0ea5e9', borderColor: '#0ea5e9', color: 'white' },
  bookingPanel: { background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e8edf5', position: 'sticky', top: 20 },
  panelTitle: { fontSize: 17, fontWeight: 700, color: '#1a3c5e', marginBottom: 16 },
  recap: { background: '#f8fafc', borderRadius: 12, padding: 16, marginBottom: 16, border: '1px solid #e8edf5' },
  recapRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 },
  recapLabel: { color: '#64748b' },
  recapValue: { fontWeight: 600, color: '#1a3c5e', textAlign: 'right', maxWidth: 160 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
  textarea: { width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', minHeight: 80, outline: 'none', boxSizing: 'border-box' },
  errorBox: { background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 },
  confirmBtn: { width: '100%', padding: 13, background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  cancelBtn: { width: '100%', padding: 11, background: 'transparent', color: '#94a3b8', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: 10 },
  emptyPanel: { textAlign: 'center', padding: '40px 20px' },
  successBox: { textAlign: 'center', padding: '20px 0' },
  successIcon: { width: 60, height: 60, background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: '#16a34a', margin: '0 auto 16px', fontWeight: 700 },
  successTitle: { fontSize: 20, fontWeight: 700, color: '#1a3c5e', marginBottom: 10 },
  successText: { fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 20 },
};