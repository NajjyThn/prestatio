import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchAppointments();
  }, [user]);

  const fetchAppointments = async () => {
    try {
      const endpoint = user.role === 'professional'
        ? '/appointments/pro'
        : '/appointments/my';
      const res = await api.get(endpoint);
      setAppointments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Confirmer l\'annulation ?')) return;
    try {
      await api.put(`/appointments/cancel/${id}`);
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur annulation');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long'
    });
  };

  const formatTime = (timeStr) => timeStr?.slice(0, 5);

  const upcoming = appointments.filter(a => a.status === 'confirmed');
  const cancelled = appointments.filter(a => a.status === 'cancelled');

  return (
    <div style={{ background: '#f4f7fb', minHeight: '100vh' }}>

      {/* Navbar */}
      <nav style={styles.navbar}>
        <span style={styles.logo} onClick={() => navigate('/')}>Réservio</span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: '#64748b' }}>👤 {user?.name}</span>
          <button style={styles.logoutBtn} onClick={() => { logout(); navigate('/'); }}>
            Déconnexion
          </button>
        </div>
      </nav>

      <div style={styles.container}>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              {user?.role === 'professional' ? '🗓️ Mes rendez-vous reçus' : '📋 Mes rendez-vous'}
            </h1>
            <p style={styles.subtitle}>
              {upcoming.length} rendez-vous à venir
            </p>
          </div>
          {user?.role !== 'professional' && (
            <button style={styles.newBtn} onClick={() => navigate('/')}>
              + Prendre un RDV
            </button>
          )}
        </div>

        {loading ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>Chargement...</p>
        ) : (
          <>
            {/* RDV à venir */}
            <h2 style={styles.sectionTitle}>À venir ({upcoming.length})</h2>
            {upcoming.length === 0 ? (
              <div style={styles.empty}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <p>Aucun rendez-vous à venir.</p>
                {user?.role !== 'professional' && (
                  <button style={{ ...styles.newBtn, marginTop: 16 }} onClick={() => navigate('/')}>
                    Prendre un rendez-vous
                  </button>
                )}
              </div>
            ) : (
              <div style={styles.cardsList}>
                {upcoming.map(appt => (
                  <div key={appt.id} style={styles.apptCard}>
                    <div style={styles.apptLeft}>
                      <div style={styles.apptDate}>{formatDate(appt.date?.split('T')[0])}</div>
                      <div style={styles.apptTime}>🕐 {formatTime(appt.start_time)} — {formatTime(appt.end_time)}</div>
                      <div style={styles.apptPerson}>
                        {user?.role === 'professional'
                          ? `👤 ${appt.client_name} · ${appt.client_email}`
                          : `👨‍💼 ${appt.professional_name} · ${appt.specialty}`
                        }
                      </div>
                      {appt.city && <div style={styles.apptLocation}>📍 {appt.city}</div>}
                      {appt.reason && <div style={styles.apptReason}>💬 {appt.reason}</div>}
                    </div>
                    <div style={styles.apptRight}>
                      <div style={styles.statusBadge}>Confirmé</div>
                      <button
                        style={styles.cancelBtn}
                        onClick={() => handleCancel(appt.id)}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* RDV annulés */}
            {cancelled.length > 0 && (
              <>
                <h2 style={{ ...styles.sectionTitle, marginTop: 36 }}>Annulés ({cancelled.length})</h2>
                <div style={styles.cardsList}>
                  {cancelled.map(appt => (
                    <div key={appt.id} style={{ ...styles.apptCard, opacity: 0.6 }}>
                      <div style={styles.apptLeft}>
                        <div style={styles.apptDate}>{formatDate(appt.date?.split('T')[0])}</div>
                        <div style={styles.apptTime}>🕐 {formatTime(appt.start_time)}</div>
                        <div style={styles.apptPerson}>
                          {user?.role === 'professional'
                            ? `👤 ${appt.client_name}`
                            : `👨‍💼 ${appt.professional_name}`
                          }
                        </div>
                      </div>
                      <div style={styles.apptRight}>
                        <div style={{ ...styles.statusBadge, background: '#fee2e2', color: '#dc2626' }}>Annulé</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  navbar: { background: 'white', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e8edf5', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' },
  logo: { fontSize: 18, fontWeight: 700, color: '#1a3c5e', cursor: 'pointer' },
  logoutBtn: { padding: '7px 16px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  container: { maxWidth: 800, margin: '0 auto', padding: '32px 24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 },
  title: { fontSize: 24, fontWeight: 700, color: '#1a3c5e', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b' },
  newBtn: { padding: '10px 20px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: '#1a3c5e', marginBottom: 14 },
  empty: { textAlign: 'center', padding: '48px 20px', color: '#94a3b8', background: 'white', borderRadius: 16, border: '1px solid #e8edf5' },
  cardsList: { display: 'flex', flexDirection: 'column', gap: 14 },
  apptCard: { background: 'white', borderRadius: 14, padding: '20px 24px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #e8edf5', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 },
  apptLeft: { flex: 1 },
  apptDate: { fontSize: 15, fontWeight: 700, color: '#1a3c5e', marginBottom: 4, textTransform: 'capitalize' },
  apptTime: { fontSize: 14, color: '#0ea5e9', fontWeight: 600, marginBottom: 6 },
  apptPerson: { fontSize: 13, color: '#475569', marginBottom: 4 },
  apptLocation: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  apptReason: { fontSize: 13, color: '#94a3b8', fontStyle: 'italic' },
  apptRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 },
  statusBadge: { background: '#dcfce7', color: '#16a34a', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 },
  cancelBtn: { padding: '7px 14px', background: 'transparent', color: '#ef4444', border: '1.5px solid #fecaca', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
};