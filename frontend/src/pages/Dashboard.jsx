import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // FETCH SAFE
  const fetchAppointments = useCallback(async () => {
    if (!user) return;

    try {
      const endpoint =
        user.role === 'professional'
          ? '/appointments/pro'
          : '/appointments/my';

      const res = await api.get(endpoint);
      setAppointments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // EFFECT FIX ESLINT
  useEffect(() => {
  if (!user) { navigate('/login'); return; }

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

  fetchAppointments();
}, [user, navigate]);

  const handleCancel = async (id) => {
    if (!window.confirm("Confirmer l'annulation ?")) return;

    try {
      await api.put(`/appointments/cancel/${id}`);
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur annulation');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const formatTime = (timeStr) => timeStr?.slice(0, 5);

  const upcoming = appointments.filter(a => a.status === 'confirmed');
  const cancelled = appointments.filter(a => a.status === 'cancelled');

  return (
    <div style={{ background: '#f4f7fb', minHeight: '100vh' }}>
      <nav style={styles.navbar}>
        <span style={styles.logo} onClick={() => navigate('/')}>Réservio</span>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: '#64748b' }}>
            👤 {user?.name}
          </span>

          <button
            style={styles.logoutBtn}
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            Déconnexion
          </button>
        </div>
      </nav>

      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              {user?.role === 'professional'
                ? '🗓️ Mes rendez-vous reçus'
                : '📋 Mes rendez-vous'}
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
          <p style={{ textAlign: 'center', padding: 40 }}>Chargement...</p>
        ) : (
          <>
            <h2 style={styles.sectionTitle}>À venir ({upcoming.length})</h2>

            <div style={styles.cardsList}>
              {upcoming.map(appt => (
                <div key={appt.id} style={styles.apptCard}>
                  <div style={styles.apptLeft}>
                    <div style={styles.apptDate}>
                      {formatDate(appt.date?.split('T')[0])}
                    </div>

                    <div style={styles.apptTime}>
                      🕐 {formatTime(appt.start_time)} — {formatTime(appt.end_time)}
                    </div>

                    <div style={styles.apptPerson}>
                      {user?.role === 'professional'
                        ? `👤 ${appt.client_name}`
                        : `👨‍💼 ${appt.professional_name}`}
                    </div>
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

            {cancelled.length > 0 && (
              <>
                <h2 style={styles.sectionTitle}>
                  Annulés ({cancelled.length})
                </h2>

                <div style={styles.cardsList}>
                  {cancelled.map(appt => (
                    <div key={appt.id} style={{ ...styles.apptCard, opacity: 0.6 }}>
                      <div style={styles.apptLeft}>
                        <div style={styles.apptDate}>
                          {formatDate(appt.date?.split('T')[0])}
                        </div>

                        <div style={styles.apptTime}>
                          🕐 {formatTime(appt.start_time)}
                        </div>

                        <div style={styles.apptPerson}>
                          {user?.role === 'professional'
                            ? `👤 ${appt.client_name}`
                            : `👨‍💼 ${appt.professional_name}`}
                        </div>
                      </div>

                      <div style={styles.apptRight}>
                        <div style={{ ...styles.statusBadge, background: '#fee2e2', color: '#dc2626' }}>
                          Annulé
                        </div>
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