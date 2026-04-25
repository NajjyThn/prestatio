import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const PAYMENT_ICONS = { 'Carte bancaire': '💳', 'Espèces': '💵', 'Virement': '🏦', 'Chèque': '📝', 'PayPal': '🅿️' };

export default function Professional() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [pro, setPro] = useState(null);
  const [availabilities, setAvailabilities] = useState([]);
  const [sheet, setSheet] = useState({ services: [], info: null });
  const [reviews, setReviews] = useState({ reviews: [], stats: null });
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [reason, setReason] = useState('');
  const [step, setStep] = useState('sheet'); // sheet | slots | confirm | success
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sheet'); // sheet | reviews

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [proRes, slotsRes, sheetRes, reviewsRes] = await Promise.all([
          api.get(`/professionals/${id}`),
          api.get(`/availabilities/${id}`),
          api.get(`/sheet/${id}`),
          api.get(`/reviews/${id}`)
        ]);
        setPro(proRes.data);
        setAvailabilities(slotsRes.data);
        setSheet(sheetRes.data);
        setReviews(reviewsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const slotsByDate = availabilities.reduce((acc, slot) => {
    const date = slot.date.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {});

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long'
    });
  };
  const formatTime = (t) => t?.slice(0, 5);

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

  const renderStars = (rating, interactive = false, onRate = null) => (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1,2,3,4,5].map(star => (
        <span key={star}
          style={{ fontSize: interactive ? 28 : 16, cursor: interactive ? 'pointer' : 'default',
            color: star <= rating ? '#f59e0b' : '#e2e8f0' }}
          onClick={() => interactive && onRate && onRate(star)}
        >★</span>
      ))}
    </div>
  );

  if (loading) return <div style={styles.loading}>Chargement...</div>;
  if (!pro) return <div style={styles.loading}>Introuvable.</div>;

  return (
    <div style={{ background: '#f4f7fb', minHeight: '100vh' }}>

      {/* Navbar */}
      <nav style={styles.navbar}>
        <span style={styles.logo} onClick={() => navigate('/')}>← Réservio</span>
        {user
          ? <span style={{ fontSize: 14, color: '#64748b' }}>👤 {user.name}</span>
          : <button style={styles.navBtn} onClick={() => navigate('/login')}>Connexion</button>
        }
      </nav>

      <div style={styles.container}>

        {/* Profil card */}
        <div style={styles.profileCard}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={styles.avatar}>{pro.name?.charAt(0).toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <h1 style={styles.proName}>{pro.name}</h1>
              <div style={styles.proSpecialty}>{pro.specialty}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0' }}>
                {reviews.stats?.average > 0 && (
                  <>
                    {renderStars(Math.round(reviews.stats.average))}
                    <span style={{ fontWeight: 700, color: '#1a3c5e', fontSize: 15 }}>
                      {parseFloat(reviews.stats.average).toFixed(1)}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: 13 }}>
                      ({reviews.stats.total} avis)
                    </span>
                  </>
                )}
              </div>
              <div style={styles.proMeta}>📍 {pro.city}{pro.address ? ` · ${pro.address}` : ''}</div>
              {pro.bio && <p style={styles.proBio}>{pro.bio}</p>}
            </div>
            <button style={styles.bookNowBtn} onClick={() => setActiveTab('slots')}>
              📅 Prendre RDV
            </button>
          </div>
        </div>

        <div style={styles.grid}>

          {/* Colonne gauche — Fiche + Avis */}
          <div>
            {/* Tabs */}
            <div style={styles.tabs}>
              {['sheet', 'slots', 'reviews'].map(tab => (
                <button key={tab}
                  style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) }}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'sheet' ? '📋 Fiche & Tarifs' : tab === 'slots' ? '📅 Disponibilités' : '⭐ Avis'}
                </button>
              ))}
            </div>

            {/* FICHE TECHNIQUE */}
            {activeTab === 'sheet' && (
              <div style={styles.panel}>

                {/* Services */}
                <div style={styles.sectionTitle}>🛠️ Prestations & Tarifs</div>
                {sheet.services.length === 0 ? (
                  <p style={styles.empty}>Aucune prestation renseignée pour le moment.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {sheet.services.map(service => (
                      <div key={service.id}
                        style={{ ...styles.serviceCard, ...(selectedService?.id === service.id ? styles.serviceCardActive : {}) }}
                        onClick={() => setSelectedService(selectedService?.id === service.id ? null : service)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={styles.serviceName}>{service.name}</div>
                            {service.description && (
                              <div style={styles.serviceDesc}>{service.description}</div>
                            )}
                            {service.duration_minutes && (
                              <div style={styles.serviceDuration}>⏱️ {service.duration_minutes} min</div>
                            )}
                          </div>
                          <div style={styles.servicePrice}>
                            {service.price ? `${parseFloat(service.price).toFixed(2)} €` : 'Sur devis'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Infos pratiques */}
                {sheet.info && (
                  <div style={{ marginTop: 28 }}>
                    <div style={styles.sectionTitle}>ℹ️ Informations pratiques</div>
                    <div style={styles.infoGrid}>

                      {/* Caution */}
                      <div style={styles.infoCard}>
                        <div style={styles.infoLabel}>Caution / Acompte</div>
                        <div style={styles.infoValue}>
                          {sheet.info.requires_deposit
                            ? `✅ Oui — ${sheet.info.deposit_amount ? parseFloat(sheet.info.deposit_amount).toFixed(2) + ' €' : 'Montant à définir'}`
                            : '❌ Non requis'
                          }
                        </div>
                      </div>

                      {/* Paiements */}
                      {sheet.info.payment_methods?.length > 0 && (
                        <div style={styles.infoCard}>
                          <div style={styles.infoLabel}>Moyens de paiement</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                            {sheet.info.payment_methods.map(method => (
                              <span key={method} style={styles.paymentBadge}>
                                {PAYMENT_ICONS[method] || '💰'} {method}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Horaires */}
                      {sheet.info.schedule && Object.keys(sheet.info.schedule).length > 0 && (
                        <div style={{ ...styles.infoCard, gridColumn: '1 / -1' }}>
                          <div style={styles.infoLabel}>Horaires d'ouverture</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8, marginTop: 8 }}>
                            {DAYS.map(day => {
                              const hours = sheet.info.schedule[day];
                              return (
                                <div key={day} style={styles.scheduleRow}>
                                  <span style={styles.scheduleDay}>{day}</span>
                                  <span style={{ fontSize: 13, color: hours ? '#1a3c5e' : '#94a3b8' }}>
                                    {hours || 'Fermé'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {sheet.info.notes && (
                        <div style={{ ...styles.infoCard, gridColumn: '1 / -1' }}>
                          <div style={styles.infoLabel}>Notes importantes</div>
                          <p style={{ fontSize: 14, color: '#475569', marginTop: 6, lineHeight: 1.6 }}>
                            {sheet.info.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* DISPONIBILITÉS */}
            {activeTab === 'slots' && (
              <div style={styles.panel}>
                <div style={styles.sectionTitle}>📅 Créneaux disponibles</div>
                {Object.keys(slotsByDate).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                    Aucun créneau disponible pour le moment.
                  </div>
                ) : (
                  Object.entries(slotsByDate).map(([date, slots]) => (
                    <div key={date} style={{ marginBottom: 20 }}>
                      <div style={styles.dateLabel}>{formatDate(date)}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {slots.map(slot => (
                          <button key={slot.id}
                            style={{ ...styles.slotBtn, ...(selectedSlot?.id === slot.id ? styles.slotBtnActive : {}) }}
                            onClick={() => { setSelectedSlot(slot); setError(''); }}
                          >
                            {formatTime(slot.start_time)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* AVIS */}
            {activeTab === 'reviews' && (
              <div style={styles.panel}>
                <div style={styles.sectionTitle}>⭐ Avis clients</div>

                {/* Stats globales */}
                {reviews.stats?.total > 0 && (
                  <div style={styles.statsBox}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 48, fontWeight: 700, color: '#1a3c5e' }}>
                        {parseFloat(reviews.stats.average).toFixed(1)}
                      </div>
                      {renderStars(Math.round(reviews.stats.average))}
                      <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
                        {reviews.stats.total} avis
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      {[5,4,3,2,1].map(star => (
                        <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 13, color: '#64748b', width: 16 }}>{star}</span>
                          <span style={{ color: '#f59e0b', fontSize: 13 }}>★</span>
                          <div style={styles.barBg}>
                            <div style={{
                              ...styles.barFill,
                              width: `${(reviews.stats[['','one','two','three','four','five'][star]] / reviews.stats.total) * 100}%`
                            }} />
                          </div>
                          <span style={{ fontSize: 12, color: '#94a3b8', width: 20 }}>
                            {reviews.stats[['','one','two','three','four','five'][star]]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Liste des avis */}
                {reviews.reviews.length === 0 ? (
                  <p style={styles.empty}>Aucun avis pour le moment.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {reviews.reviews.map(review => (
                      <div key={review.id} style={styles.reviewCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div style={{ fontWeight: 700, color: '#1a3c5e', fontSize: 14 }}>
                            {review.client_name}
                          </div>
                          <div style={{ fontSize: 12, color: '#94a3b8' }}>
                            {new Date(review.created_at).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                        {renderStars(review.rating)}
                        {review.comment && (
                          <p style={{ fontSize: 14, color: '#475569', marginTop: 8, lineHeight: 1.5 }}>
                            {review.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Colonne droite — Panneau réservation */}
          <div style={styles.bookingPanel}>

            {step === 'success' ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={styles.successIcon}>✓</div>
                <h3 style={styles.successTitle}>Confirmé !</h3>
                <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>
                  RDV avec <strong>{pro.name}</strong><br />
                  <strong>{formatDate(selectedSlot?.date?.split('T')[0])}</strong> à <strong>{formatTime(selectedSlot?.start_time)}</strong>
                </p>
                <button style={styles.confirmBtn} onClick={() => navigate('/dashboard')}>
                  Voir mes RDV
                </button>
                <button style={{ ...styles.confirmBtn, background: '#f1f5f9', color: '#1a3c5e', marginTop: 10 }}
                  onClick={() => navigate('/')}>
                  Retour à l'accueil
                </button>
              </div>

            ) : selectedSlot ? (
              <div>
                <h3 style={styles.panelTitle}>Confirmation</h3>
                <div style={styles.recap}>
                  <div style={styles.recapRow}>
                    <span style={styles.recapLabel}>Date</span>
                    <span style={styles.recapValue}>{formatDate(selectedSlot.date?.split('T')[0])}</span>
                  </div>
                  <div style={styles.recapRow}>
                    <span style={styles.recapLabel}>Heure</span>
                    <span style={styles.recapValue}>{formatTime(selectedSlot.start_time)}</span>
                  </div>
                  {selectedService && (
                    <div style={styles.recapRow}>
                      <span style={styles.recapLabel}>Prestation</span>
                      <span style={styles.recapValue}>{selectedService.name} — {selectedService.price ? parseFloat(selectedService.price).toFixed(2) + ' €' : 'Sur devis'}</span>
                    </div>
                  )}
                  {sheet.info?.requires_deposit && (
                    <div style={{ ...styles.recapRow, background: '#fef9c3', borderRadius: 8, padding: '6px 8px' }}>
                      <span style={{ color: '#92400e', fontSize: 12 }}>⚠️ Acompte requis</span>
                      <span style={{ color: '#92400e', fontSize: 12, fontWeight: 700 }}>
                        {sheet.info.deposit_amount ? parseFloat(sheet.info.deposit_amount).toFixed(2) + ' €' : 'À définir'}
                      </span>
                    </div>
                  )}
                </div>

                <label style={styles.label}>Motif (optionnel)</label>
                <textarea style={styles.textarea} placeholder="Décrivez votre demande..."
                  value={reason} onChange={e => setReason(e.target.value)} />

                {error && <div style={styles.errorBox}>{error}</div>}

                {!user ? (
                  <button style={styles.confirmBtn} onClick={() => navigate('/login')}>
                    Se connecter pour réserver
                  </button>
                ) : (
                  <button style={styles.confirmBtn} onClick={handleBook}>
                    ✓ Confirmer le RDV
                  </button>
                )}
                <button style={styles.cancelBtn} onClick={() => setSelectedSlot(null)}>Annuler</button>
              </div>

            ) : (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
                <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>
                  Choisissez une prestation puis un créneau pour réserver.
                </p>
                <button style={styles.confirmBtn} onClick={() => setActiveTab('slots')}>
                  Voir les disponibilités
                </button>
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
  navBtn: { padding: '8px 18px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  container: { maxWidth: 1060, margin: '0 auto', padding: '28px 24px' },
  profileCard: { background: 'white', borderRadius: 16, padding: 28, marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e8edf5' },
  avatar: { width: 72, height: 72, borderRadius: 16, background: 'linear-gradient(135deg, #0ea5e9, #1a3c5e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: 'white', flexShrink: 0 },
  proName: { fontSize: 24, fontWeight: 700, color: '#1a3c5e', marginBottom: 4 },
  proSpecialty: { fontSize: 15, color: '#0ea5e9', fontWeight: 600 },
  proMeta: { fontSize: 14, color: '#64748b', marginTop: 6 },
  proBio: { fontSize: 14, color: '#475569', lineHeight: 1.6, marginTop: 8 },
  bookNowBtn: { padding: '12px 24px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' },
  tabs: { display: 'flex', gap: 8, marginBottom: 16 },
  tab: { padding: '9px 18px', border: '1.5px solid #e2e8f0', borderRadius: 10, background: 'white', fontSize: 13, fontWeight: 600, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' },
  tabActive: { background: '#0ea5e9', borderColor: '#0ea5e9', color: 'white' },
  panel: { background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e8edf5' },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: '#1a3c5e', marginBottom: 16 },
  empty: { color: '#94a3b8', fontSize: 14, textAlign: 'center', padding: '24px 0' },
  serviceCard: { background: '#f8fafc', borderRadius: 12, padding: '14px 16px', border: '1.5px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.15s' },
  serviceCardActive: { borderColor: '#0ea5e9', background: '#f0f9ff' },
  serviceName: { fontSize: 15, fontWeight: 700, color: '#1a3c5e', marginBottom: 4 },
  serviceDesc: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  serviceDuration: { fontSize: 12, color: '#94a3b8' },
  servicePrice: { fontSize: 18, fontWeight: 700, color: '#0ea5e9', whiteSpace: 'nowrap', marginLeft: 12 },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  infoCard: { background: '#f8fafc', borderRadius: 12, padding: 14, border: '1px solid #e2e8f0' },
  infoLabel: { fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 },
  infoValue: { fontSize: 14, fontWeight: 600, color: '#1a3c5e' },
  paymentBadge: { background: 'white', border: '1px solid #e2e8f0', borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 500, color: '#475569' },
  scheduleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', borderRadius: 8, padding: '6px 10px', border: '1px solid #e2e8f0' },
  scheduleDay: { fontSize: 13, fontWeight: 600, color: '#475569' },
  dateLabel: { fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #f1f5f9', textTransform: 'capitalize' },
  slotBtn: { padding: '10px 16px', border: '1.5px solid #e2e8f0', borderRadius: 10, background: 'white', fontSize: 14, fontWeight: 600, color: '#1a3c5e', cursor: 'pointer', fontFamily: 'inherit' },
  slotBtnActive: { background: '#0ea5e9', borderColor: '#0ea5e9', color: 'white' },
  statsBox: { display: 'flex', gap: 24, alignItems: 'center', background: '#f8fafc', borderRadius: 12, padding: 20, marginBottom: 20, flexWrap: 'wrap' },
  barBg: { flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', background: '#f59e0b', borderRadius: 4, transition: 'width 0.5s' },
  reviewCard: { background: '#f8fafc', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0' },
  bookingPanel: { background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e8edf5', position: 'sticky', top: 20 },
  panelTitle: { fontSize: 17, fontWeight: 700, color: '#1a3c5e', marginBottom: 16 },
  recap: { background: '#f8fafc', borderRadius: 12, padding: 14, marginBottom: 16, border: '1px solid #e8edf5', display: 'flex', flexDirection: 'column', gap: 8 },
  recapRow: { display: 'flex', justifyContent: 'space-between', fontSize: 14 },
  recapLabel: { color: '#64748b' },
  recapValue: { fontWeight: 600, color: '#1a3c5e', textAlign: 'right', maxWidth: 160, fontSize: 13 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
  textarea: { width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', minHeight: 70, outline: 'none', boxSizing: 'border-box', marginBottom: 14 },
  errorBox: { background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 },
  confirmBtn: { width: '100%', padding: 13, background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  cancelBtn: { width: '100%', padding: 11, background: 'transparent', color: '#94a3b8', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: 10 },
  successIcon: { width: 56, height: 56, background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#16a34a', margin: '0 auto 14px', fontWeight: 700 },
  successTitle: { fontSize: 20, fontWeight: 700, color: '#1a3c5e', marginBottom: 8 },
};