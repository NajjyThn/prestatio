import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await api.get('/appointments/my');
      setAppointments(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role === 'professional') { navigate('/pro'); return; }
    fetchAppointments();
  }, [user, navigate, fetchAppointments]);

  const handleCancel = async (id) => {
    if (!window.confirm("Confirmer l'annulation ?")) return;
    try { await api.put(`/appointments/cancel/${id}`); fetchAppointments(); }
    catch (err) { alert(err.response?.data?.error || 'Erreur'); }
  };

  const openReview = (appt) => {
    setReviewModal(appt);
    setReviewForm({ rating: 0, comment: '' });
    setReviewError('');
    setReviewSuccess(false);
    setHoveredStar(0);
  };

  const handleSubmitReview = async () => {
    setReviewError('');
    if (reviewForm.rating === 0) { setReviewError('Veuillez choisir une note.'); return; }
    try {
      await api.post('/reviews', {
        professional_id: reviewModal.professional_id,
        appointment_id: reviewModal.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment
      });
      setReviewSuccess(true);
      fetchAppointments();
      setTimeout(() => setReviewModal(null), 2200);
    } catch (err) { setReviewError(err.response?.data?.error || "Erreur lors de l'envoi"); }
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  };
  const formatTime = (t) => t?.slice(0, 5);

  const upcoming = appointments.filter(a => a.status === 'confirmed');
  const cancelled = appointments.filter(a => a.status === 'cancelled');
  const displayed = activeTab === 'upcoming' ? upcoming : activeTab === 'past' ? [] : cancelled;

  const navItems = [
    { icon: '🏠', label: 'Accueil', action: () => navigate('/') },
    { icon: '📅', label: 'Mes rendez-vous', action: () => {}, active: true },
    { icon: '💆‍♀️', label: 'Mes prestations', action: () => {} },
    { icon: '💬', label: 'Messages', action: () => {}, badge: 2 },
    { icon: '♥', label: 'Favoris', action: () => {} },
    { icon: '⚙️', label: 'Paramètres', action: () => {} },
  ];

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .nav-item:hover { background: #fff0f4 !important; color: #e8648c !important; }
      `}</style>

      {/* SIDEBAR */}
      <div style={S.sidebar}>
        <div style={S.sidebarLogo}>Presta<span style={{ color: '#e8648c' }}>&</span>You</div>
        <div style={S.sidebarTagline}>Beauté sur rendez-vous</div>
        <nav style={S.sidebarNav}>
          {navItems.map(item => (
            <button key={item.label} className="nav-item"
              style={{ ...S.navItem, ...(item.active ? S.navItemActive : {}) }}
              onClick={item.action}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={S.navLabel}>{item.label}</span>
              {item.badge && <span style={S.navBadge}>{item.badge}</span>}
            </button>
          ))}
        </nav>
        <div style={S.sidebarBottom}>
          <div style={S.referralBox}>
            <div style={S.referralTitle}>Parrainez vos amies</div>
            <div style={S.referralDesc}>Gagnez 10€ de crédit beauté !</div>
            <button style={S.referralBtn}>Parrainer</button>
          </div>
          <div style={S.sidebarLinks}>
            <span style={S.sidebarLink}>Aide & support</span>
            <span style={{ ...S.sidebarLink, color: '#e8648c' }} onClick={() => { logout(); navigate('/'); }}>
              Déconnexion
            </span>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={S.main}>
        {/* TOPBAR */}
        <div style={S.topbar}>
          <div>
            <h1 style={S.greeting}>Bonjour {user?.name?.split(' ')[0]} ! <span style={{ color: '#e8648c' }}>♥</span></h1>
            <p style={S.greetingSub}>Prête à vous sentir belle aujourd'hui ?</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={S.bellBtn}>🔔</div>
            <div style={S.userChip}>
              <div style={S.userAvatar}>{user?.name?.charAt(0).toUpperCase()}</div>
              <span style={S.userName}>Bonjour, {user?.name?.split(' ')[0]}</span>
              <span style={{ color: '#ccc', fontSize: 12 }}>▾</span>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div style={S.quickActions}>
          {[
            { icon: '📅', title: 'Réserver un rendez-vous', desc: 'Choisissez votre prestation et réservez en quelques clics.', action: () => navigate('/') },
            { icon: '💆‍♀️', title: 'Nos coiffeuses', desc: 'Découvrez nos expertes et leurs spécialités.' },
            { icon: '💄', title: 'Nos maquilleuses', desc: 'Trouvez la maquilleuse parfaite pour vous.' },
            { icon: '💬', title: 'Mes messages', desc: 'Échangez avec vos professionnelles.' },
          ].map(qa => (
            <div key={qa.title} style={S.qaCard} onClick={qa.action}>
              <div style={S.qaIcon}>{qa.icon}</div>
              <div style={S.qaTitle}>{qa.title}</div>
              <div style={S.qaDesc}>{qa.desc}</div>
              <div style={S.qaArrow}>→</div>
            </div>
          ))}
        </div>

        {/* PROFESSIONNELLES */}
        <div style={S.section}>
          <div style={S.sectionHeader}>
            <h2 style={S.sectionTitle}>Nos professionnelles</h2>
            <button style={S.seeAll} onClick={() => navigate('/')}>Voir tout</button>
          </div>

          {/* RENDEZ-VOUS */}
          <h2 style={{ ...S.sectionTitle, marginTop: 32, marginBottom: 4 }}>Mes rendez-vous</h2>

          {/* Rappel */}
          {upcoming.length > 0 && (
            <div style={S.reminderBox}>
              <span style={{ color: '#e8648c' }}>ℹ️</span>
              <span style={S.reminderText}>Rappel : Vous avez {upcoming.length} rendez-vous cette semaine.</span>
            </div>
          )}

          {/* Tabs */}
          <div style={S.apptTabs}>
            {[
              { id: 'upcoming', label: 'À venir', count: upcoming.length },
              { id: 'past', label: 'Passés', count: 0 },
              { id: 'cancelled', label: 'Annulés', count: cancelled.length },
            ].map(t => (
              <button key={t.id}
                style={{ ...S.apptTab, ...(activeTab === t.id ? S.apptTabActive : {}) }}
                onClick={() => setActiveTab(t.id)}>
                {t.label}
                {t.count > 0 && <span style={{ ...S.apptTabBadge, ...(activeTab === t.id ? S.apptTabBadgeActive : {}) }}>{t.count}</span>}
              </button>
            ))}
          </div>

          {loading ? (
            <p style={{ color: '#aaa', fontFamily: 'DM Sans', padding: 20 }}>Chargement...</p>
          ) : displayed.length === 0 ? (
            <div style={S.empty}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
              <p style={{ color: '#aaa', fontFamily: 'DM Sans', fontSize: 14 }}>
                {activeTab === 'upcoming' ? 'Aucun rendez-vous à venir.' : 'Aucun rendez-vous.'}
              </p>
              {activeTab === 'upcoming' && (
                <button style={S.bookNewBtn} onClick={() => navigate('/')}>Réserver une nouvelle prestation</button>
              )}
            </div>
          ) : (
            <div style={S.apptList}>
              {(activeTab === 'upcoming' ? upcoming : cancelled).map(appt => (
                <div key={appt.id} style={S.apptCard}>
                  <div style={S.apptDateBadge}>
                    <div style={S.apptDateNum}>{new Date(appt.date).toLocaleDateString('fr-FR', { day: 'numeric' })}</div>
                    <div style={S.apptDateMonth}>{new Date(appt.date).toLocaleDateString('fr-FR', { month: 'short' })}</div>
                    <div style={S.apptDateTime}>{formatTime(appt.start_time)}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={S.apptTitle}>{appt.professional_name || 'Professionnelle'}</div>
                    <div style={S.apptSpecialty}>{appt.specialty}</div>
                    <div style={S.apptMeta}>
                      {appt.city && <span>📍 {appt.city}</span>}
                      {appt.address && <span> · {appt.address}</span>}
                    </div>
                    {appt.reason && <div style={S.apptReason}>💬 {appt.reason}</div>}
                  </div>
                  <div style={S.apptRight}>
                    <span style={{ ...S.statusBadge, ...(appt.status === 'confirmed' ? S.statusConfirmed : S.statusCancelled) }}>
                      {appt.status === 'confirmed' ? 'Confirmé' : 'Annulé'}
                    </span>
                    <button style={S.detailBtn} onClick={() => navigate(`/professional/${appt.professional_id}`)}>
                      Voir les détails
                    </button>
                    {appt.status === 'confirmed' && (
                      <button style={S.cancelBtn} onClick={() => handleCancel(appt.id)}>Annuler</button>
                    )}
                    {appt.status === 'cancelled' && (
                      <button style={S.reviewBtn} onClick={() => openReview(appt)}>⭐ Laisser un avis</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button style={S.bookNewBtn} onClick={() => navigate('/')}>
            Réserver une nouvelle prestation
          </button>

          {/* Aide */}
          <div style={S.helpBox}>
            <div style={S.helpTitle}>Besoin d'aide ?</div>
            <div style={S.helpItem}><span style={S.helpIcon}>❓</span> Consulter la FAQ <span style={S.helpArrow}>›</span></div>
            <div style={S.helpItem}><span style={S.helpIcon}>💬</span> Nous contacter <span style={S.helpArrow}>›</span></div>
          </div>
        </div>
      </div>

      {/* MODAL NOTATION */}
      {reviewModal && (
        <div style={S.overlay} onClick={() => setReviewModal(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            {reviewSuccess ? (
              <div style={{ textAlign: 'center', padding: '48px 28px' }}>
                <div style={{ fontSize: 56, marginBottom: 14 }}>⭐</div>
                <h3 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Merci pour votre avis !</h3>
                <p style={{ color: '#888', fontSize: 14, fontFamily: 'DM Sans' }}>Votre avis a bien été publié.</p>
              </div>
            ) : (
              <>
                <div style={S.modalHeader}>
                  <div>
                    <h3 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>Laisser un avis <span style={{ color: '#e8648c' }}>⭐</span></h3>
                    <p style={{ fontSize: 13, color: '#888', fontFamily: 'DM Sans', marginTop: 4 }}>
                      {reviewModal.professional_name} · {formatDate(reviewModal.date?.split('T')[0])}
                    </p>
                  </div>
                  <button style={S.closeBtn} onClick={() => setReviewModal(null)}>×</button>
                </div>
                <div style={{ padding: '0 28px 28px' }}>
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#333', fontFamily: 'DM Sans', marginBottom: 14 }}>
                      Quelle note donnez-vous ?
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                      {[1,2,3,4,5].map(star => (
                        <span key={star}
                          style={{ fontSize: 44, cursor: 'pointer', color: star <= (hoveredStar || reviewForm.rating) ? '#e8648c' : '#fce4ec', transition: 'all 0.1s', display: 'inline-block', transform: star <= (hoveredStar || reviewForm.rating) ? 'scale(1.15)' : 'scale(1)' }}
                          onMouseEnter={() => setHoveredStar(star)}
                          onMouseLeave={() => setHoveredStar(0)}
                          onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        >★</span>
                      ))}
                    </div>
                    {reviewForm.rating > 0 && (
                      <p style={{ fontSize: 14, color: '#e8648c', fontWeight: 700, marginTop: 10, fontFamily: 'DM Sans' }}>
                        {['', '😞 Très mauvais', '😐 Mauvais', '🙂 Correct', '😊 Bien', '🤩 Excellent !'][reviewForm.rating]}
                      </p>
                    )}
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 6, fontFamily: 'DM Sans' }}>Commentaire (optionnel)</label>
                    <textarea style={{ width: '100%', padding: '12px', border: '1.5px solid #fce4ec', borderRadius: 12, fontSize: 14, fontFamily: 'DM Sans', resize: 'vertical', minHeight: 90, outline: 'none', boxSizing: 'border-box' }}
                      placeholder="Décrivez votre expérience..."
                      value={reviewForm.comment}
                      onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })} />
                  </div>
                  {reviewError && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: 13, fontFamily: 'DM Sans' }}>{reviewError}</div>}
                  <button style={S.submitReviewBtn} onClick={handleSubmitReview}>⭐ Publier mon avis</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  page: { display: 'flex', minHeight: '100vh', fontFamily: "'Cormorant Garamond', Georgia, serif", background: '#fff9f9' },
  sidebar: { width: 240, background: 'white', borderRight: '1px solid #fce4ec', display: 'flex', flexDirection: 'column', padding: '28px 0', position: 'sticky', top: 0, height: '100vh', flexShrink: 0 },
  sidebarLogo: { fontSize: 24, fontWeight: 700, color: '#1a1a1a', padding: '0 24px', marginBottom: 2 },
  sidebarTagline: { fontSize: 12, color: '#aaa', fontFamily: 'DM Sans', padding: '0 24px', marginBottom: 28 },
  sidebarNav: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '0 12px' },
  navItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: 14, color: '#555', transition: 'all 0.2s', textAlign: 'left', width: '100%' },
  navItemActive: { background: '#fff0f4', color: '#e8648c', fontWeight: 600 },
  navLabel: { flex: 1 },
  navBadge: { background: '#e8648c', color: 'white', borderRadius: 50, fontSize: 11, fontWeight: 700, padding: '2px 7px', fontFamily: 'DM Sans' },
  sidebarBottom: { padding: '0 16px' },
  referralBox: { background: '#1a1a1a', borderRadius: 16, padding: '18px', marginBottom: 16, textAlign: 'center' },
  referralTitle: { fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 4 },
  referralDesc: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: 'DM Sans', marginBottom: 12 },
  referralBtn: { padding: '9px 20px', background: '#e8648c', color: 'white', border: 'none', borderRadius: 50, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans', width: '100%' },
  sidebarLinks: { display: 'flex', flexDirection: 'column', gap: 8 },
  sidebarLink: { fontSize: 13, color: '#888', fontFamily: 'DM Sans', cursor: 'pointer', padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 8 },

  main: { flex: 1, padding: '28px 32px', overflowY: 'auto' },
  topbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  greeting: { fontSize: 30, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 },
  greetingSub: { fontSize: 14, color: '#888', fontFamily: 'DM Sans' },
  bellBtn: { width: 40, height: 40, borderRadius: '50%', background: '#fce4ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, cursor: 'pointer' },
  userChip: { display: 'flex', alignItems: 'center', gap: 10, background: 'white', border: '1px solid #fce4ec', borderRadius: 50, padding: '6px 16px 6px 6px', cursor: 'pointer' },
  userAvatar: { width: 32, height: 32, borderRadius: '50%', background: '#e8648c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white' },
  userName: { fontSize: 13, fontWeight: 600, color: '#1a1a1a', fontFamily: 'DM Sans' },

  quickActions: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 },
  qaCard: { background: 'white', borderRadius: 16, padding: '20px 18px', border: '1.5px solid #fce4ec', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' },
  qaIcon: { width: 44, height: 44, borderRadius: '50%', background: '#fce4ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 12 },
  qaTitle: { fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 },
  qaDesc: { fontSize: 12, color: '#888', fontFamily: 'DM Sans', lineHeight: 1.5, marginBottom: 12 },
  qaArrow: { width: 28, height: 28, borderRadius: '50%', background: '#e8648c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'white', fontFamily: 'DM Sans', fontWeight: 700 },

  section: { background: 'white', borderRadius: 20, padding: '24px', border: '1px solid #fce4ec' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 700, color: '#1a1a1a' },
  seeAll: { fontSize: 13, color: '#e8648c', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans' },

  reminderBox: { display: 'flex', alignItems: 'center', gap: 10, background: '#fff0f4', border: '1px solid #fce4ec', borderRadius: 10, padding: '10px 14px', marginBottom: 16 },
  reminderText: { fontSize: 13, fontFamily: 'DM Sans', color: '#c2185b', fontWeight: 500 },

  apptTabs: { display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid #fce4ec' },
  apptTab: { padding: '10px 20px', border: 'none', background: 'transparent', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans', color: '#aaa', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '2px solid transparent', marginBottom: -2 },
  apptTabActive: { color: '#e8648c', borderBottomColor: '#e8648c' },
  apptTabBadge: { background: '#fce4ec', color: '#e8648c', borderRadius: 50, fontSize: 11, fontWeight: 700, padding: '1px 7px', fontFamily: 'DM Sans' },
  apptTabBadgeActive: { background: '#e8648c', color: 'white' },

  empty: { textAlign: 'center', padding: '32px 20px', color: '#aaa' },
  bookNewBtn: { display: 'block', width: '100%', padding: '14px', background: '#1a1a1a', color: 'white', border: 'none', borderRadius: 50, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans', marginTop: 20, textAlign: 'center' },

  apptList: { display: 'flex', flexDirection: 'column', gap: 14 },
  apptCard: { display: 'flex', gap: 16, alignItems: 'flex-start', padding: '16px', background: '#fff9f9', borderRadius: 14, border: '1px solid #fce4ec' },
  apptDateBadge: { background: '#e8648c', borderRadius: 12, padding: '10px 12px', textAlign: 'center', flexShrink: 0, minWidth: 56 },
  apptDateNum: { fontSize: 22, fontWeight: 700, color: 'white', lineHeight: 1 },
  apptDateMonth: { fontSize: 11, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', marginTop: 2 },
  apptDateTime: { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontFamily: 'DM Sans', marginTop: 4, fontWeight: 600 },
  apptTitle: { fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 2 },
  apptSpecialty: { fontSize: 13, color: '#e8648c', fontWeight: 600, fontFamily: 'DM Sans', marginBottom: 4 },
  apptMeta: { fontSize: 12, color: '#888', fontFamily: 'DM Sans', marginBottom: 4 },
  apptReason: { fontSize: 12, color: '#aaa', fontFamily: 'DM Sans', fontStyle: 'italic' },
  apptRight: { display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 },
  statusBadge: { padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, fontFamily: 'DM Sans' },
  statusConfirmed: { background: '#dcfce7', color: '#16a34a' },
  statusCancelled: { background: '#fee2e2', color: '#dc2626' },
  detailBtn: { padding: '7px 14px', background: 'white', border: '1.5px solid #fce4ec', borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans', color: '#333', whiteSpace: 'nowrap' },
  cancelBtn: { padding: '7px 14px', background: 'transparent', border: '1.5px solid #fecaca', borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans', color: '#ef4444' },
  reviewBtn: { padding: '7px 14px', background: '#fff8e7', border: '1.5px solid #fde68a', borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans', color: '#d97706' },

  helpBox: { marginTop: 24, padding: '18px', background: '#fff9f9', borderRadius: 14, border: '1px solid #fce4ec' },
  helpTitle: { fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 },
  helpItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #fce4ec', fontSize: 14, fontFamily: 'DM Sans', color: '#555', cursor: 'pointer' },
  helpIcon: { fontSize: 16 },
  helpArrow: { marginLeft: 'auto', color: '#ccc', fontSize: 18 },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(26,10,15,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' },
  modal: { background: 'white', borderRadius: 24, maxWidth: 460, width: '100%', boxShadow: '0 32px 80px rgba(232,100,140,0.25)', border: '1px solid #fce4ec' },
  modalHeader: { padding: '24px 28px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  closeBtn: { width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#fce4ec', cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e8648c' },
  submitReviewBtn: { width: '100%', padding: 13, background: '#e8648c', color: 'white', border: 'none', borderRadius: 50, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans', boxShadow: '0 4px 16px rgba(232,100,140,0.35)' },
};
