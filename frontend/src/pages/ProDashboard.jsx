import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const PAYMENT_OPTIONS = ['Carte bancaire', 'Espèces', 'Virement', 'Chèque', 'PayPal'];

export default function ProDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('appointments');
  const [stats, setStats] = useState({ total: 0, upcoming: 0, rating: 0, reviews: 0 });
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(true);
  const [profile, setProfile] = useState({ specialty: '', city: '', address: '', bio: '', latitude: '', longitude: '' });
  const [profileSaved, setProfileSaved] = useState(false);
  const [availabilities, setAvailabilities] = useState([]);
  const [newSlot, setNewSlot] = useState({ date: '', start_time: '', end_time: '' });
  const [slotError, setSlotError] = useState('');
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({ name: '', description: '', price: '', duration_minutes: '' });
  const [serviceError, setServiceError] = useState('');
  const [proInfo, setProInfo] = useState({ requires_deposit: false, deposit_amount: '', payment_methods: [], schedule: {}, notes: '' });
  const [infoSaved, setInfoSaved] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [apptRes, proRes] = await Promise.all([api.get('/appointments/pro'), api.get('/professionals')]);
      const appts = apptRes.data;
      setAppointments(appts);
      const upcoming = appts.filter(a => a.status === 'confirmed').length;
      setStats(prev => ({ ...prev, total: appts.length, upcoming }));
      const myPro = proRes.data.find(p => p.email === user?.email);
      if (myPro) {
        setProfile({ specialty: myPro.specialty || '', city: myPro.city || '', address: myPro.address || '', bio: myPro.bio || '', latitude: myPro.latitude || '', longitude: myPro.longitude || '' });
        const [slotsRes, sheetRes, reviewsRes] = await Promise.all([api.get(`/availabilities/${myPro.id}`), api.get(`/sheet/${myPro.id}`), api.get(`/reviews/${myPro.id}`)]);
        setAvailabilities(slotsRes.data);
        setServices(sheetRes.data.services || []);
        if (sheetRes.data.info) setProInfo({ requires_deposit: sheetRes.data.info.requires_deposit || false, deposit_amount: sheetRes.data.info.deposit_amount || '', payment_methods: sheetRes.data.info.payment_methods || [], schedule: sheetRes.data.info.schedule || {}, notes: sheetRes.data.info.notes || '' });
        const rs = reviewsRes.data.stats;
        if (rs) setStats(prev => ({ ...prev, rating: parseFloat(rs.average || 0).toFixed(1), reviews: rs.total || 0 }));
      }
    } catch (err) { console.error(err); }
    finally { setApptLoading(false); }
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== 'professional') { navigate('/login'); return; }
    fetchAll();
  }, [user, navigate, fetchAll]);

  const handleSaveProfile = async () => {
    try { await api.put('/professionals', profile); setProfileSaved(true); setTimeout(() => setProfileSaved(false), 3000); }
    catch (err) { alert(err.response?.data?.error || 'Erreur'); }
  };
  const handleCreateProfile = async () => {
    try { await api.post('/professionals', profile); setProfileSaved(true); setTimeout(() => setProfileSaved(false), 3000); fetchAll(); }
    catch (err) { alert(err.response?.data?.error || 'Erreur'); }
  };
  const handleAddSlot = async () => {
    setSlotError('');
    if (!newSlot.date || !newSlot.start_time || !newSlot.end_time) { setSlotError('Remplissez tous les champs'); return; }
    if (newSlot.start_time >= newSlot.end_time) { setSlotError("L'heure de fin doit être après l'heure de début"); return; }
    try { await api.post('/availabilities', newSlot); setNewSlot({ date: '', start_time: '', end_time: '' }); fetchAll(); }
    catch (err) { setSlotError(err.response?.data?.error || 'Erreur ajout créneau'); }
  };
  const handleDeleteSlot = async (id) => {
    if (!window.confirm('Supprimer ce créneau ?')) return;
    try { await api.delete(`/availabilities/${id}`); fetchAll(); }
    catch (err) { alert(err.response?.data?.error || 'Erreur'); }
  };
  const generateSlots = async () => {
    if (!newSlot.date) { setSlotError('Choisissez une date'); return; }
    const slots = ['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30'];
    try { for (let i = 0; i < slots.length - 1; i++) await api.post('/availabilities', { date: newSlot.date, start_time: slots[i], end_time: slots[i+1] }); fetchAll(); }
    catch (err) { setSlotError('Certains créneaux existent déjà'); fetchAll(); }
  };
  const handleAddService = async () => {
    setServiceError('');
    if (!newService.name) { setServiceError('Le nom est obligatoire'); return; }
    try { await api.post('/sheet/service', newService); setNewService({ name: '', description: '', price: '', duration_minutes: '' }); fetchAll(); }
    catch (err) { setServiceError(err.response?.data?.error || 'Erreur'); }
  };
  const handleDeleteService = async (id) => {
    if (!window.confirm('Supprimer ce service ?')) return;
    try { await api.delete(`/sheet/service/${id}`); fetchAll(); }
    catch (err) { alert('Erreur'); }
  };
  const handleSaveInfo = async () => {
    try { await api.post('/sheet/info', proInfo); setInfoSaved(true); setTimeout(() => setInfoSaved(false), 3000); }
    catch (err) { alert(err.response?.data?.error || 'Erreur'); }
  };
  const togglePayment = (m) => setProInfo(prev => ({ ...prev, payment_methods: prev.payment_methods.includes(m) ? prev.payment_methods.filter(x => x !== m) : [...prev.payment_methods, m] }));
  const updateSchedule = (day, val) => setProInfo(prev => ({ ...prev, schedule: { ...prev.schedule, [day]: val } }));
  const handleCancelAppt = async (id) => {
    if (!window.confirm("Confirmer l'annulation ?")) return;
    try { await api.put(`/appointments/cancel/${id}`); fetchAll(); }
    catch (err) { alert(err.response?.data?.error || 'Erreur'); }
  };

  const formatTime = (t) => t?.slice(0, 5);
  const slotsByDate = availabilities.reduce((acc, slot) => { const d = slot.date.split('T')[0]; if (!acc[d]) acc[d] = []; acc[d].push(slot); return acc; }, {});

  const tabs = [
    { id: 'appointments', icon: '📋', label: 'Rendez-vous', count: stats.upcoming },
    { id: 'availabilities', icon: '📅', label: 'Disponibilités', count: availabilities.length },
    { id: 'services', icon: '💆‍♀️', label: 'Mes artistes', count: services.length },
    { id: 'info', icon: 'ℹ️', label: 'Infos pratiques' },
    { id: 'profile', icon: '👤', label: 'Mon profil' },
  ];

  return (
    <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", background: '#fff9f9', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus, textarea:focus, select:focus { border-color: #e8648c !important; outline: none; }
        .tab-btn:hover { background: #fff0f4 !important; color: #e8648c !important; }
        .pink-btn:hover { background: #d4547a !important; }
        .delete-btn:hover { color: #dc2626 !important; }
      `}</style>

      {/* NAVBAR */}
      <nav style={S.navbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={S.logo}>Glam<span style={{ color: '#e8648c' }}>&</span>You</div>
          <span style={S.proBadge}>PRO ✨</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={S.navUser}>Bonjour, {user?.name?.split(' ')[0]} 👋</span>
          <button style={S.viewBtn} onClick={() => navigate('/')}>Voir le site</button>
          <button style={S.logoutBtn} onClick={() => { logout(); navigate('/'); }}>Déconnexion</button>
        </div>
      </nav>

      <div style={S.container}>

        {/* STATS */}
        <div style={S.statsGrid}>
          {[
            { num: stats.upcoming, label: 'RDV à venir', icon: '📅', color: '#fce4ec' },
            { num: stats.total, label: 'Total RDV', icon: '📊', color: '#fce4ec' },
            { num: stats.rating > 0 ? `⭐ ${stats.rating}` : '—', label: 'Note moyenne', icon: '⭐', color: '#fff8e7' },
            { num: stats.reviews, label: 'Avis reçus', icon: '💬', color: '#fce4ec' },
          ].map(s => (
            <div key={s.label} style={S.statCard}>
              <div style={{ ...S.statIcon, background: s.color }}>{s.icon}</div>
              <div style={S.statNum}>{s.num}</div>
              <div style={S.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={S.tabsRow}>
          {tabs.map(tab => (
            <button key={tab.id} className="tab-btn"
              style={{ ...S.tab, ...(activeTab === tab.id ? S.tabActive : {}) }}
              onClick={() => setActiveTab(tab.id)}>
              <span>{tab.icon}</span> {tab.label}
              {tab.count !== undefined && (
                <span style={{ ...S.tabBadge, ...(activeTab === tab.id ? S.tabBadgeActive : {}) }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* PANEL */}
        <div style={S.panel}>

          {/* ===== RENDEZ-VOUS ===== */}
          {activeTab === 'appointments' && (
            <>
              <h2 style={S.panelTitle}>📋 Rendez-vous à venir</h2>
              {apptLoading ? <p style={S.loading}>Chargement...</p> :
                appointments.filter(a => a.status === 'confirmed').length === 0 ? (
                  <div style={S.emptyState}><div style={{ fontSize: 48, marginBottom: 10 }}>📭</div><p style={S.emptyText}>Aucun rendez-vous à venir.</p></div>
                ) : (
                  <div style={S.apptList}>
                    {appointments.filter(a => a.status === 'confirmed').map(appt => (
                      <div key={appt.id} style={S.apptCard}>
                        <div style={S.apptDate}>
                          <div style={S.apptDateNum}>{new Date(appt.date).toLocaleDateString('fr-FR', { day: 'numeric' })}</div>
                          <div style={S.apptDateMonth}>{new Date(appt.date).toLocaleDateString('fr-FR', { month: 'short' })}</div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={S.apptClient}>{appt.client_name}</div>
                          <div style={S.apptEmail}>{appt.client_email}</div>
                          <div style={S.apptTime}>🕐 {formatTime(appt.start_time)} — {formatTime(appt.end_time)}</div>
                          {appt.reason && <div style={S.apptReason}>💬 {appt.reason}</div>}
                        </div>
                        <div style={S.apptActions}>
                          <span style={S.confirmedBadge}>Confirmé</span>
                          <button style={S.cancelApptBtn} onClick={() => handleCancelAppt(appt.id)}>Annuler</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
              {appointments.filter(a => a.status === 'cancelled').length > 0 && (
                <>
                  <h3 style={{ ...S.panelTitle, marginTop: 28, fontSize: 16 }}>Annulés</h3>
                  <div style={S.apptList}>
                    {appointments.filter(a => a.status === 'cancelled').map(appt => (
                      <div key={appt.id} style={{ ...S.apptCard, opacity: 0.5 }}>
                        <div style={S.apptDate}><div style={S.apptDateNum}>{new Date(appt.date).toLocaleDateString('fr-FR', { day: 'numeric' })}</div><div style={S.apptDateMonth}>{new Date(appt.date).toLocaleDateString('fr-FR', { month: 'short' })}</div></div>
                        <div style={{ flex: 1 }}><div style={S.apptClient}>{appt.client_name}</div><div style={S.apptTime}>🕐 {formatTime(appt.start_time)}</div></div>
                        <span style={{ ...S.confirmedBadge, background: '#fee2e2', color: '#dc2626' }}>Annulé</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* ===== DISPONIBILITÉS ===== */}
          {activeTab === 'availabilities' && (
            <>
              <h2 style={S.panelTitle}>📅 Gérer mes disponibilités</h2>
              <div style={S.addBox}>
                <h3 style={S.subTitle}>Ajouter un créneau</h3>
                <div style={S.slotForm}>
                  <div style={S.fg}><label style={S.label}>Date</label><input style={S.input} type="date" value={newSlot.date} min={new Date().toISOString().split('T')[0]} onChange={e => setNewSlot({ ...newSlot, date: e.target.value })} /></div>
                  <div style={S.fg}><label style={S.label}>Début</label><input style={S.input} type="time" value={newSlot.start_time} onChange={e => setNewSlot({ ...newSlot, start_time: e.target.value })} /></div>
                  <div style={S.fg}><label style={S.label}>Fin</label><input style={S.input} type="time" value={newSlot.end_time} onChange={e => setNewSlot({ ...newSlot, end_time: e.target.value })} /></div>
                  <button className="pink-btn" style={S.pinkBtn} onClick={handleAddSlot}>+ Ajouter</button>
                </div>
                {slotError && <div style={S.errorBox}>{slotError}</div>}
                <div style={{ marginTop: 10 }}>
                  <p style={{ fontSize: 13, color: '#999', fontFamily: 'DM Sans', marginBottom: 8 }}>Ou générer une journée complète (9h-17h) :</p>
                  <button style={S.generateBtn} onClick={generateSlots}>⚡ Générer automatiquement</button>
                </div>
              </div>
              {Object.keys(slotsByDate).length === 0 ? (
                <div style={S.emptyState}><div style={{ fontSize: 40, marginBottom: 10 }}>📅</div><p style={S.emptyText}>Aucun créneau. Ajoutez-en ci-dessus.</p></div>
              ) : (
                Object.entries(slotsByDate).sort().map(([date, slots]) => (
                  <div key={date} style={{ marginBottom: 20 }}>
                    <div style={S.dateHeader}>{new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} <span style={{ fontSize: 12, color: '#bbb' }}>· {slots.length} créneau{slots.length > 1 ? 'x' : ''}</span></div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {slots.map(slot => (
                        <div key={slot.id} style={S.slotChip}>
                          <span style={{ fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13 }}>{formatTime(slot.start_time)}</span>
                          <button className="delete-btn" style={S.deleteSlotBtn} onClick={() => handleDeleteSlot(slot.id)}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* ===== SERVICES ===== */}
          {activeTab === 'services' && (
            <>
              <h2 style={S.panelTitle}>💆‍♀️ Mes prestations & tarifs</h2>
              <div style={S.addBox}>
                <h3 style={S.subTitle}>Ajouter une prestation</h3>
                <div style={S.serviceForm}>
                  <div style={S.fg}><label style={S.label}>Nom *</label><input style={S.input} placeholder="Ex: Maquillage mariée..." value={newService.name} onChange={e => setNewService({ ...newService, name: e.target.value })} /></div>
                  <div style={S.fg}><label style={S.label}>Description</label><input style={S.input} placeholder="Courte description..." value={newService.description} onChange={e => setNewService({ ...newService, description: e.target.value })} /></div>
                  <div style={S.fg}><label style={S.label}>Prix (€)</label><input style={S.input} type="number" placeholder="0.00" value={newService.price} onChange={e => setNewService({ ...newService, price: e.target.value })} /></div>
                  <div style={S.fg}><label style={S.label}>Durée (min)</label><input style={S.input} type="number" placeholder="30" value={newService.duration_minutes} onChange={e => setNewService({ ...newService, duration_minutes: e.target.value })} /></div>
                </div>
                {serviceError && <div style={S.errorBox}>{serviceError}</div>}
                <button className="pink-btn" style={S.pinkBtn} onClick={handleAddService}>+ Ajouter la prestation</button>
              </div>
              {services.length === 0 ? (
                <div style={S.emptyState}><div style={{ fontSize: 40, marginBottom: 10 }}>💄</div><p style={S.emptyText}>Aucune prestation.</p></div>
              ) : (
                <div style={S.servicesList}>
                  {services.map(s => (
                    <div key={s.id} style={S.serviceCard}>
                      <div style={{ flex: 1 }}>
                        <div style={S.serviceName}>{s.name}</div>
                        {s.description && <div style={S.serviceDesc}>{s.description}</div>}
                        {s.duration_minutes && <span style={S.serviceTag}>⏱️ {s.duration_minutes} min</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={S.servicePrice}>{s.price ? `${parseFloat(s.price).toFixed(2)} €` : 'Sur devis'}</div>
                        <button className="delete-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#ccc', transition: 'color 0.2s' }} onClick={() => handleDeleteService(s.id)}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ===== INFOS ===== */}
          {activeTab === 'info' && (
            <>
              <h2 style={S.panelTitle}>ℹ️ Informations pratiques</h2>
              <div style={S.section}>
                <h3 style={S.subTitle}>💰 Caution / Acompte</h3>
                <div style={S.toggleRow}>
                  <span style={{ fontSize: 14, color: '#555', fontFamily: 'DM Sans' }}>Exiger un acompte ?</span>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button style={{ ...S.toggleBtn, ...(proInfo.requires_deposit ? S.toggleBtnActive : {}) }} onClick={() => setProInfo({ ...proInfo, requires_deposit: true })}>Oui</button>
                    <button style={{ ...S.toggleBtn, ...(!proInfo.requires_deposit ? S.toggleBtnActive : {}) }} onClick={() => setProInfo({ ...proInfo, requires_deposit: false })}>Non</button>
                  </div>
                </div>
                {proInfo.requires_deposit && <div style={{ marginTop: 12 }}><label style={S.label}>Montant (€)</label><input style={{ ...S.input, maxWidth: 180 }} type="number" placeholder="Ex: 20" value={proInfo.deposit_amount} onChange={e => setProInfo({ ...proInfo, deposit_amount: e.target.value })} /></div>}
              </div>
              <div style={S.section}>
                <h3 style={S.subTitle}>💳 Moyens de paiement</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {PAYMENT_OPTIONS.map(m => (
                    <button key={m} style={{ ...S.payBtn, ...(proInfo.payment_methods.includes(m) ? S.payBtnActive : {}) }} onClick={() => togglePayment(m)}>{m}</button>
                  ))}
                </div>
              </div>
              <div style={S.section}>
                <h3 style={S.subTitle}>🕐 Horaires d'ouverture</h3>
                <p style={{ fontSize: 13, color: '#bbb', fontFamily: 'DM Sans', marginBottom: 12 }}>Laissez vide si fermé. Ex : "9h00 - 18h00"</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {DAYS.map(day => (
                    <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <label style={{ ...S.label, minWidth: 80, margin: 0 }}>{day}</label>
                      <input style={{ ...S.input, flex: 1 }} placeholder="Ex: 9h00 - 18h00" value={proInfo.schedule[day] || ''} onChange={e => updateSchedule(day, e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
              <div style={S.section}>
                <h3 style={S.subTitle}>📝 Notes</h3>
                <textarea style={{ ...S.input, resize: 'vertical', minHeight: 80, width: '100%' }} placeholder="Ex: Parking disponible, conditions d'annulation..." value={proInfo.notes} onChange={e => setProInfo({ ...proInfo, notes: e.target.value })} />
              </div>
              <button className="pink-btn" style={S.saveBtn} onClick={handleSaveInfo}>{infoSaved ? '✅ Sauvegardé !' : 'Sauvegarder'}</button>
            </>
          )}

          {/* ===== PROFIL ===== */}
          {activeTab === 'profile' && (
            <>
              <h2 style={S.panelTitle}>👤 Mon profil professionnel</h2>
              <div style={S.profileForm}>
                <div style={S.fg}><label style={S.label}>Spécialité *</label><input style={S.input} placeholder="Ex: Maquilleuse, Coiffeuse..." value={profile.specialty} onChange={e => setProfile({ ...profile, specialty: e.target.value })} /></div>
                <div style={S.fg}><label style={S.label}>Ville *</label><input style={S.input} placeholder="Ex: Paris, Lyon..." value={profile.city} onChange={e => setProfile({ ...profile, city: e.target.value })} /></div>
                <div style={S.fg}><label style={S.label}>Adresse</label><input style={S.input} placeholder="Ex: 12 rue de la Paix" value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })} /></div>
                <div style={S.fg}><label style={S.label}>Latitude GPS</label><input style={S.input} type="number" placeholder="Ex: 48.8566" value={profile.latitude} onChange={e => setProfile({ ...profile, latitude: e.target.value })} /></div>
                <div style={S.fg}><label style={S.label}>Longitude GPS</label><input style={S.input} type="number" placeholder="Ex: 2.3522" value={profile.longitude} onChange={e => setProfile({ ...profile, longitude: e.target.value })} /></div>
                <div style={{ gridColumn: '1/-1' }}><label style={S.label}>Bio / Présentation</label><textarea style={{ ...S.input, resize: 'vertical', minHeight: 90, width: '100%' }} placeholder="Décrivez votre activité, votre expérience..." value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} /></div>
              </div>
              <p style={{ fontSize: 12, color: '#bbb', fontFamily: 'DM Sans', marginBottom: 16 }}>💡 Trouvez vos coordonnées GPS sur <a href="https://maps.google.com" target="_blank" rel="noreferrer" style={{ color: '#e8648c' }}>Google Maps</a> → clic droit sur votre adresse.</p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="pink-btn" style={S.saveBtn} onClick={handleSaveProfile}>{profileSaved ? '✅ Sauvegardé !' : 'Sauvegarder'}</button>
                <button style={S.outlineBtn} onClick={handleCreateProfile}>Créer le profil (si nouveau)</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const S = {
  navbar: { background: 'white', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #fce4ec', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(232,100,140,0.06)' },
  logo: { fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: '#1a1a1a' },
  proBadge: { background: '#fce4ec', color: '#e8648c', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, fontFamily: 'DM Sans' },
  navUser: { fontSize: 14, color: '#888', fontFamily: 'DM Sans' },
  viewBtn: { padding: '7px 16px', background: '#fce4ec', color: '#e8648c', border: 'none', borderRadius: 50, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans' },
  logoutBtn: { padding: '7px 16px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 50, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans' },
  container: { maxWidth: 1000, margin: '0 auto', padding: '28px 24px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 },
  statCard: { background: 'white', borderRadius: 16, padding: '20px', border: '1.5px solid #fce4ec', textAlign: 'center', boxShadow: '0 2px 10px rgba(232,100,140,0.06)' },
  statIcon: { width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, margin: '0 auto 10px' },
  statNum: { fontSize: 26, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#aaa', fontFamily: 'DM Sans' },
  tabsRow: { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  tab: { padding: '10px 18px', border: '1.5px solid #fce4ec', borderRadius: 50, background: 'white', fontSize: 13, fontWeight: 600, color: '#888', cursor: 'pointer', fontFamily: 'DM Sans', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' },
  tabActive: { background: '#e8648c', borderColor: '#e8648c', color: 'white', boxShadow: '0 4px 16px rgba(232,100,140,0.3)' },
  tabBadge: { background: '#fce4ec', color: '#e8648c', borderRadius: 50, padding: '1px 8px', fontSize: 12, fontWeight: 700, fontFamily: 'DM Sans' },
  tabBadgeActive: { background: 'rgba(255,255,255,0.25)', color: 'white' },
  panel: { background: 'white', borderRadius: 20, padding: 28, boxShadow: '0 4px 20px rgba(232,100,140,0.07)', border: '1.5px solid #fce4ec' },
  panelTitle: { fontSize: 20, fontWeight: 700, color: '#1a1a1a', marginBottom: 20 },
  loading: { color: '#bbb', fontFamily: 'DM Sans', padding: 20 },
  emptyState: { textAlign: 'center', padding: '40px 20px' },
  emptyText: { color: '#bbb', fontFamily: 'DM Sans', fontSize: 14 },
  apptList: { display: 'flex', flexDirection: 'column', gap: 12 },
  apptCard: { display: 'flex', gap: 16, alignItems: 'flex-start', background: '#fff9f9', borderRadius: 14, padding: '16px', border: '1px solid #fce4ec' },
  apptDate: { background: '#e8648c', borderRadius: 12, padding: '8px 12px', textAlign: 'center', flexShrink: 0, minWidth: 52 },
  apptDateNum: { fontSize: 22, fontWeight: 700, color: 'white', lineHeight: 1 },
  apptDateMonth: { fontSize: 11, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', marginTop: 2 },
  apptClient: { fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 2 },
  apptEmail: { fontSize: 13, color: '#888', fontFamily: 'DM Sans', marginBottom: 4 },
  apptTime: { fontSize: 13, color: '#e8648c', fontWeight: 600, fontFamily: 'DM Sans' },
  apptReason: { fontSize: 12, color: '#bbb', fontFamily: 'DM Sans', fontStyle: 'italic', marginTop: 4 },
  apptActions: { display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 },
  confirmedBadge: { background: '#dcfce7', color: '#16a34a', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, fontFamily: 'DM Sans' },
  cancelApptBtn: { padding: '6px 12px', background: 'transparent', color: '#ef4444', border: '1.5px solid #fecaca', borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans' },
  addBox: { background: '#fff9f9', borderRadius: 14, padding: 20, border: '1px solid #fce4ec', marginBottom: 24 },
  subTitle: { fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 14, fontFamily: 'DM Sans' },
  slotForm: { display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 10 },
  serviceForm: { display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', gap: 12, marginBottom: 14 },
  profileForm: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 },
  fg: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 12, fontWeight: 600, color: '#666', fontFamily: 'DM Sans', marginBottom: 4 },
  input: { padding: '11px 14px', border: '1.5px solid #fce4ec', borderRadius: 12, fontSize: 14, fontFamily: 'DM Sans', color: '#1a1a1a', background: 'white', transition: 'border-color 0.2s' },
  pinkBtn: { padding: '11px 22px', background: '#e8648c', color: 'white', border: 'none', borderRadius: 50, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(232,100,140,0.3)', transition: 'all 0.2s' },
  generateBtn: { padding: '9px 18px', background: '#1a1a1a', color: 'white', border: 'none', borderRadius: 50, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans' },
  errorBox: { background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 10, marginTop: 10, fontSize: 13, fontFamily: 'DM Sans' },
  dateHeader: { fontSize: 14, fontWeight: 700, color: '#1a1a1a', paddingBottom: 8, borderBottom: '1px solid #fce4ec', marginBottom: 10, textTransform: 'capitalize' },
  slotChip: { display: 'flex', alignItems: 'center', gap: 6, background: '#fff0f4', border: '1px solid #fce4ec', borderRadius: 20, padding: '6px 12px' },
  deleteSlotBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 16, padding: 0, lineHeight: 1, fontWeight: 700, transition: 'color 0.2s' },
  servicesList: { display: 'flex', flexDirection: 'column', gap: 10 },
  serviceCard: { display: 'flex', alignItems: 'center', gap: 16, background: '#fff9f9', borderRadius: 12, padding: '14px 18px', border: '1px solid #fce4ec' },
  serviceName: { fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 2 },
  serviceDesc: { fontSize: 13, color: '#888', fontFamily: 'DM Sans' },
  serviceTag: { fontSize: 12, color: '#e8648c', background: '#fff0f4', border: '1px solid #fce4ec', borderRadius: 20, padding: '2px 10px', fontFamily: 'DM Sans', display: 'inline-block', marginTop: 6 },
  servicePrice: { fontSize: 18, fontWeight: 700, color: '#e8648c', whiteSpace: 'nowrap' },
  section: { marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #fce4ec' },
  toggleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  toggleBtn: { padding: '8px 20px', border: '1.5px solid #fce4ec', borderRadius: 50, background: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans', color: '#888', transition: 'all 0.2s' },
  toggleBtnActive: { background: '#e8648c', borderColor: '#e8648c', color: 'white' },
  payBtn: { padding: '9px 18px', border: '1.5px solid #fce4ec', borderRadius: 50, background: 'white', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans', color: '#555', transition: 'all 0.2s' },
  payBtnActive: { background: '#e8648c', borderColor: '#e8648c', color: 'white', fontWeight: 700 },
  saveBtn: { padding: '12px 28px', background: '#e8648c', color: 'white', border: 'none', borderRadius: 50, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans', boxShadow: '0 4px 16px rgba(232,100,140,0.3)', transition: 'all 0.2s' },
  outlineBtn: { padding: '12px 24px', background: 'white', border: '1.5px solid #e8648c', borderRadius: 50, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans', color: '#e8648c' },
};
