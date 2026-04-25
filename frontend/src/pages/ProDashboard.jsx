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

  // Stats
  const [stats, setStats] = useState({ total: 0, upcoming: 0, rating: 0, reviews: 0 });

  // Appointments
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(true);

  // Profile
  const [profile, setProfile] = useState({ specialty: '', city: '', address: '', bio: '', latitude: '', longitude: '' });
  const [profileSaved, setProfileSaved] = useState(false);

  // Availabilities
  const [availabilities, setAvailabilities] = useState([]);
  const [newSlot, setNewSlot] = useState({ date: '', start_time: '', end_time: '' });
  const [slotError, setSlotError] = useState('');

  // Services
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({ name: '', description: '', price: '', duration_minutes: '' });
  const [serviceError, setServiceError] = useState('');

  // Pro Info
  const [proInfo, setProInfo] = useState({
    requires_deposit: false,
    deposit_amount: '',
    payment_methods: [],
    schedule: {},
    notes: ''
  });
  const [infoSaved, setInfoSaved] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [apptRes, proRes] = await Promise.all([
        api.get('/appointments/pro'),
        api.get('/professionals')
      ]);

      const appts = apptRes.data;
      setAppointments(appts);

      const upcoming = appts.filter(a => a.status === 'confirmed').length;
      setStats(prev => ({ ...prev, total: appts.length, upcoming }));

      // Trouver le profil du pro connecté
      const myPro = proRes.data.find(p => p.email === user?.email);
      if (myPro) {
        setProfile({
          specialty: myPro.specialty || '',
          city: myPro.city || '',
          address: myPro.address || '',
          bio: myPro.bio || '',
          latitude: myPro.latitude || '',
          longitude: myPro.longitude || ''
        });

        // Charger les créneaux, services et infos
        const [slotsRes, sheetRes, reviewsRes] = await Promise.all([
          api.get(`/availabilities/${myPro.id}`),
          api.get(`/sheet/${myPro.id}`),
          api.get(`/reviews/${myPro.id}`)
        ]);

        setAvailabilities(slotsRes.data);
        setServices(sheetRes.data.services || []);

        if (sheetRes.data.info) {
          setProInfo({
            requires_deposit: sheetRes.data.info.requires_deposit || false,
            deposit_amount: sheetRes.data.info.deposit_amount || '',
            payment_methods: sheetRes.data.info.payment_methods || [],
            schedule: sheetRes.data.info.schedule || {},
            notes: sheetRes.data.info.notes || ''
          });
        }

        const reviewStats = reviewsRes.data.stats;
        if (reviewStats) {
          setStats(prev => ({
            ...prev,
            rating: parseFloat(reviewStats.average || 0).toFixed(1),
            reviews: reviewStats.total || 0
          }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setApptLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== 'professional') {
      navigate('/login');
      return;
    }
    fetchAll();
  }, [user, navigate, fetchAll]);

  // --- PROFILE ---
  const handleSaveProfile = async () => {
    try {
      await api.put('/professionals', profile);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur sauvegarde profil');
    }
  };

  const handleCreateProfile = async () => {
    try {
      await api.post('/professionals', profile);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur création profil');
    }
  };

  // --- AVAILABILITIES ---
  const handleAddSlot = async () => {
    setSlotError('');
    if (!newSlot.date || !newSlot.start_time || !newSlot.end_time) {
      setSlotError('Remplissez tous les champs');
      return;
    }
    if (newSlot.start_time >= newSlot.end_time) {
      setSlotError('L\'heure de fin doit être après l\'heure de début');
      return;
    }
    try {
      await api.post('/availabilities', newSlot);
      setNewSlot({ date: '', start_time: '', end_time: '' });
      fetchAll();
    } catch (err) {
      setSlotError(err.response?.data?.error || 'Erreur ajout créneau');
    }
  };

  const handleDeleteSlot = async (id) => {
    if (!window.confirm('Supprimer ce créneau ?')) return;
    try {
      await api.delete(`/availabilities/${id}`);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur suppression');
    }
  };

  const generateSlots = async () => {
    if (!newSlot.date) { setSlotError('Choisissez d\'abord une date'); return; }
    const slots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
    try {
      for (let i = 0; i < slots.length - 1; i++) {
        await api.post('/availabilities', {
          date: newSlot.date,
          start_time: slots[i],
          end_time: slots[i + 1]
        });
      }
      fetchAll();
    } catch (err) {
      setSlotError('Certains créneaux existent déjà');
      fetchAll();
    }
  };

  // --- SERVICES ---
  const handleAddService = async () => {
    setServiceError('');
    if (!newService.name) { setServiceError('Le nom est obligatoire'); return; }
    try {
      await api.post('/sheet/service', newService);
      setNewService({ name: '', description: '', price: '', duration_minutes: '' });
      fetchAll();
    } catch (err) {
      setServiceError(err.response?.data?.error || 'Erreur ajout service');
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Supprimer ce service ?')) return;
    try {
      await api.delete(`/sheet/service/${id}`);
      fetchAll();
    } catch (err) {
      alert('Erreur suppression');
    }
  };

  // --- PRO INFO ---
  const handleSaveInfo = async () => {
    try {
      await api.post('/sheet/info', proInfo);
      setInfoSaved(true);
      setTimeout(() => setInfoSaved(false), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur sauvegarde');
    }
  };

  const togglePayment = (method) => {
    setProInfo(prev => ({
      ...prev,
      payment_methods: prev.payment_methods.includes(method)
        ? prev.payment_methods.filter(m => m !== method)
        : [...prev.payment_methods, method]
    }));
  };

  const updateSchedule = (day, value) => {
    setProInfo(prev => ({
      ...prev,
      schedule: { ...prev.schedule, [day]: value }
    }));
  };

  // --- CANCEL APPT ---
  const handleCancelAppt = async (id) => {
    if (!window.confirm('Confirmer l\'annulation ?')) return;
    try {
      await api.put(`/appointments/cancel/${id}`);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'short', day: 'numeric', month: 'short'
    });
  };
  const formatTime = (t) => t?.slice(0, 5);

  const slotsByDate = availabilities.reduce((acc, slot) => {
    const date = slot.date.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {});

  const tabs = [
    { id: 'appointments', label: '📋 Rendez-vous', count: stats.upcoming },
    { id: 'availabilities', label: '📅 Disponibilités', count: availabilities.length },
    { id: 'services', label: '🛠️ Services & Tarifs', count: services.length },
    { id: 'info', label: 'ℹ️ Infos pratiques', count: null },
    { id: 'profile', label: '👤 Mon profil', count: null },
  ];

  return (
    <div style={{ background: '#f4f7fb', minHeight: '100vh' }}>

      {/* NAVBAR */}
      <nav style={styles.navbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={styles.logo} onClick={() => navigate('/')}>Réservio</span>
          <span style={styles.proBadge}>PRO</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: '#64748b' }}>👤 {user?.name}</span>
          <button style={styles.viewBtn} onClick={() => navigate('/')}>Voir le site</button>
          <button style={styles.logoutBtn} onClick={() => { logout(); navigate('/'); }}>Déconnexion</button>
        </div>
      </nav>

      <div style={styles.container}>

        {/* STATS */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statNum}>{stats.upcoming}</div>
            <div style={styles.statLabel}>RDV à venir</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNum}>{stats.total}</div>
            <div style={styles.statLabel}>Total RDV</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNum}>{stats.rating > 0 ? `⭐ ${stats.rating}` : '—'}</div>
            <div style={styles.statLabel}>Note moyenne</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNum}>{stats.reviews}</div>
            <div style={styles.statLabel}>Avis reçus</div>
          </div>
        </div>

        {/* TABS */}
        <div style={styles.tabsRow}>
          {tabs.map(tab => (
            <button key={tab.id}
              style={{ ...styles.tab, ...(activeTab === tab.id ? styles.tabActive : {}) }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.count !== null && (
                <span style={{ ...styles.tabBadge, ...(activeTab === tab.id ? styles.tabBadgeActive : {}) }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ==================== RENDEZ-VOUS ==================== */}
        {activeTab === 'appointments' && (
          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>📋 Rendez-vous à venir</h2>
            {apptLoading ? (
              <p style={styles.loading}>Chargement...</p>
            ) : appointments.filter(a => a.status === 'confirmed').length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                <p>Aucun rendez-vous à venir.</p>
              </div>
            ) : (
              <div style={styles.apptList}>
                {appointments.filter(a => a.status === 'confirmed').map(appt => (
                  <div key={appt.id} style={styles.apptCard}>
                    <div style={styles.apptDateBox}>
                      <div style={styles.apptDateNum}>
                        {new Date(appt.date).toLocaleDateString('fr-FR', { day: 'numeric' })}
                      </div>
                      <div style={styles.apptDateMonth}>
                        {new Date(appt.date).toLocaleDateString('fr-FR', { month: 'short' })}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={styles.apptClientName}>{appt.client_name}</div>
                      <div style={styles.apptClientEmail}>{appt.client_email}</div>
                      <div style={styles.apptTime}>
                        🕐 {formatTime(appt.start_time)} — {formatTime(appt.end_time)}
                      </div>
                      {appt.reason && (
                        <div style={styles.apptReason}>💬 {appt.reason}</div>
                      )}
                    </div>
                    <div style={styles.apptActions}>
                      <div style={styles.confirmedBadge}>Confirmé</div>
                      <button style={styles.cancelApptBtn} onClick={() => handleCancelAppt(appt.id)}>
                        Annuler
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {appointments.filter(a => a.status === 'cancelled').length > 0 && (
              <>
                <h3 style={{ ...styles.panelTitle, marginTop: 32, fontSize: 15 }}>Annulés</h3>
                <div style={styles.apptList}>
                  {appointments.filter(a => a.status === 'cancelled').map(appt => (
                    <div key={appt.id} style={{ ...styles.apptCard, opacity: 0.5 }}>
                      <div style={styles.apptDateBox}>
                        <div style={styles.apptDateNum}>
                          {new Date(appt.date).toLocaleDateString('fr-FR', { day: 'numeric' })}
                        </div>
                        <div style={styles.apptDateMonth}>
                          {new Date(appt.date).toLocaleDateString('fr-FR', { month: 'short' })}
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={styles.apptClientName}>{appt.client_name}</div>
                        <div style={styles.apptTime}>🕐 {formatTime(appt.start_time)}</div>
                      </div>
                      <div style={{ ...styles.confirmedBadge, background: '#fee2e2', color: '#dc2626' }}>
                        Annulé
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ==================== DISPONIBILITÉS ==================== */}
        {activeTab === 'availabilities' && (
          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>📅 Gérer mes disponibilités</h2>

            {/* Ajouter un créneau */}
            <div style={styles.addBox}>
              <h3 style={styles.subTitle}>Ajouter un créneau</h3>
              <div style={styles.slotForm}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Date</label>
                  <input style={styles.input} type="date"
                    value={newSlot.date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setNewSlot({ ...newSlot, date: e.target.value })} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Début</label>
                  <input style={styles.input} type="time"
                    value={newSlot.start_time}
                    onChange={e => setNewSlot({ ...newSlot, start_time: e.target.value })} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Fin</label>
                  <input style={styles.input} type="time"
                    value={newSlot.end_time}
                    onChange={e => setNewSlot({ ...newSlot, end_time: e.target.value })} />
                </div>
                <button style={styles.addBtn} onClick={handleAddSlot}>+ Ajouter</button>
              </div>

              {slotError && <div style={styles.errorBox}>{slotError}</div>}

              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>
                  Ou générer automatiquement des créneaux de 30 min sur une journée :
                </p>
                <button style={styles.generateBtn} onClick={generateSlots}>
                  ⚡ Générer une journée complète (9h-17h)
                </button>
              </div>
            </div>

            {/* Liste des créneaux */}
            {Object.keys(slotsByDate).length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
                <p>Aucun créneau disponible. Ajoutez-en ci-dessus.</p>
              </div>
            ) : (
              Object.entries(slotsByDate).sort().map(([date, slots]) => (
                <div key={date} style={{ marginBottom: 20 }}>
                  <div style={styles.dateHeader}>
                    {new Date(date).toLocaleDateString('fr-FR', {
                      weekday: 'long', day: 'numeric', month: 'long'
                    })}
                    <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>
                      {slots.length} créneau{slots.length > 1 ? 'x' : ''}
                    </span>
                  </div>
                  <div style={styles.slotsRow}>
                    {slots.map(slot => (
                      <div key={slot.id} style={styles.slotChip}>
                        <span>{formatTime(slot.start_time)}</span>
                        <button
                          style={styles.deleteSlotBtn}
                          onClick={() => handleDeleteSlot(slot.id)}
                        >×</button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ==================== SERVICES ==================== */}
        {activeTab === 'services' && (
          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>🛠️ Mes services & tarifs</h2>

            {/* Ajouter un service */}
            <div style={styles.addBox}>
              <h3 style={styles.subTitle}>Ajouter une prestation</h3>
              <div style={styles.serviceForm}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nom de la prestation *</label>
                  <input style={styles.input} placeholder="Ex: Consultation, Coaching..."
                    value={newService.name}
                    onChange={e => setNewService({ ...newService, name: e.target.value })} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Description</label>
                  <input style={styles.input} placeholder="Courte description..."
                    value={newService.description}
                    onChange={e => setNewService({ ...newService, description: e.target.value })} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Prix (€)</label>
                  <input style={styles.input} type="number" placeholder="0.00"
                    value={newService.price}
                    onChange={e => setNewService({ ...newService, price: e.target.value })} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Durée (min)</label>
                  <input style={styles.input} type="number" placeholder="30"
                    value={newService.duration_minutes}
                    onChange={e => setNewService({ ...newService, duration_minutes: e.target.value })} />
                </div>
              </div>
              {serviceError && <div style={styles.errorBox}>{serviceError}</div>}
              <button style={styles.addBtn} onClick={handleAddService}>+ Ajouter la prestation</button>
            </div>

            {/* Liste des services */}
            {services.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🛠️</div>
                <p>Aucune prestation. Ajoutez vos services ci-dessus.</p>
              </div>
            ) : (
              <div style={styles.servicesList}>
                {services.map(service => (
                  <div key={service.id} style={styles.serviceCard}>
                    <div style={{ flex: 1 }}>
                      <div style={styles.serviceName}>{service.name}</div>
                      {service.description && (
                        <div style={styles.serviceDesc}>{service.description}</div>
                      )}
                      <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                        {service.duration_minutes && (
                          <span style={styles.serviceTag}>⏱️ {service.duration_minutes} min</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={styles.servicePrice}>
                        {service.price ? `${parseFloat(service.price).toFixed(2)} €` : 'Sur devis'}
                      </div>
                      <button style={styles.deleteBtn} onClick={() => handleDeleteService(service.id)}>
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== INFOS PRATIQUES ==================== */}
        {activeTab === 'info' && (
          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>ℹ️ Informations pratiques</h2>

            {/* Caution */}
            <div style={styles.section}>
              <h3 style={styles.subTitle}>💰 Caution / Acompte</h3>
              <div style={styles.toggleRow}>
                <span style={{ fontSize: 14, color: '#475569' }}>Exiger un acompte ?</span>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    style={{ ...styles.toggleBtn, ...(proInfo.requires_deposit ? styles.toggleBtnActive : {}) }}
                    onClick={() => setProInfo({ ...proInfo, requires_deposit: true })}
                  >Oui</button>
                  <button
                    style={{ ...styles.toggleBtn, ...(!proInfo.requires_deposit ? styles.toggleBtnActive : {}) }}
                    onClick={() => setProInfo({ ...proInfo, requires_deposit: false })}
                  >Non</button>
                </div>
              </div>
              {proInfo.requires_deposit && (
                <div style={{ marginTop: 12 }}>
                  <label style={styles.label}>Montant de l'acompte (€)</label>
                  <input style={{ ...styles.input, maxWidth: 200 }} type="number" placeholder="Ex: 20"
                    value={proInfo.deposit_amount}
                    onChange={e => setProInfo({ ...proInfo, deposit_amount: e.target.value })} />
                </div>
              )}
            </div>

            {/* Paiements */}
            <div style={styles.section}>
              <h3 style={styles.subTitle}>💳 Moyens de paiement acceptés</h3>
              <div style={styles.paymentGrid}>
                {PAYMENT_OPTIONS.map(method => (
                  <button key={method}
                    style={{ ...styles.paymentBtn, ...(proInfo.payment_methods.includes(method) ? styles.paymentBtnActive : {}) }}
                    onClick={() => togglePayment(method)}
                  >
                    {method === 'Carte bancaire' ? '💳' :
                      method === 'Espèces' ? '💵' :
                        method === 'Virement' ? '🏦' :
                          method === 'Chèque' ? '📝' : '🅿️'} {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Horaires */}
            <div style={styles.section}>
              <h3 style={styles.subTitle}>🕐 Horaires d'ouverture</h3>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 14 }}>
                Laissez vide si fermé ce jour-là. Exemple : "9h00 - 18h00"
              </p>
              <div style={styles.scheduleGrid}>
                {DAYS.map(day => (
                  <div key={day} style={styles.scheduleRow}>
                    <label style={styles.scheduleDay}>{day}</label>
                    <input style={{ ...styles.input, flex: 1 }}
                      placeholder="Ex: 9h00 - 18h00"
                      value={proInfo.schedule[day] || ''}
                      onChange={e => updateSchedule(day, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div style={styles.section}>
              <h3 style={styles.subTitle}>📝 Notes importantes</h3>
              <textarea style={styles.textarea}
                placeholder="Ex: Parking disponible, accès PMR, conditions d'annulation..."
                value={proInfo.notes}
                onChange={e => setProInfo({ ...proInfo, notes: e.target.value })}
              />
            </div>

            <button style={styles.saveBtn} onClick={handleSaveInfo}>
              {infoSaved ? '✅ Sauvegardé !' : 'Sauvegarder les infos'}
            </button>
          </div>
        )}

        {/* ==================== PROFIL ==================== */}
        {activeTab === 'profile' && (
          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>👤 Mon profil professionnel</h2>

            <div style={styles.profileForm}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Spécialité *</label>
                <input style={styles.input} placeholder="Ex: Coach sportif, Consultant..."
                  value={profile.specialty}
                  onChange={e => setProfile({ ...profile, specialty: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Ville *</label>
                <input style={styles.input} placeholder="Ex: Paris, Lyon..."
                  value={profile.city}
                  onChange={e => setProfile({ ...profile, city: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Adresse</label>
                <input style={styles.input} placeholder="Ex: 12 rue de la Paix"
                  value={profile.address}
                  onChange={e => setProfile({ ...profile, address: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Latitude (pour la géolocalisation)</label>
                <input style={styles.input} type="number" placeholder="Ex: 48.8566"
                  value={profile.latitude}
                  onChange={e => setProfile({ ...profile, latitude: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Longitude</label>
                <input style={styles.input} type="number" placeholder="Ex: 2.3522"
                  value={profile.longitude}
                  onChange={e => setProfile({ ...profile, longitude: e.target.value })} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={styles.label}>Bio / Présentation</label>
                <textarea style={styles.textarea}
                  placeholder="Décrivez votre activité, votre expérience..."
                  value={profile.bio}
                  onChange={e => setProfile({ ...profile, bio: e.target.value })}
                />
              </div>
            </div>

            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
              💡 Pour trouver vos coordonnées GPS, allez sur{' '}
              <a href="https://www.google.com/maps" target="_blank" rel="noreferrer" style={{ color: '#0ea5e9' }}>
                Google Maps
              </a>
              , faites un clic droit sur votre adresse → les coordonnées apparaissent.
            </p>

            <div style={{ display: 'flex', gap: 12 }}>
              <button style={styles.saveBtn} onClick={handleSaveProfile}>
                {profileSaved ? '✅ Sauvegardé !' : 'Sauvegarder le profil'}
              </button>
              <button style={styles.createBtn} onClick={handleCreateProfile}>
                Créer le profil (si nouveau)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  navbar: { background: 'white', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e8edf5', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 100 },
  logo: { fontSize: 20, fontWeight: 700, color: '#1a3c5e', cursor: 'pointer' },
  proBadge: { background: '#0ea5e9', color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, letterSpacing: '0.05em' },
  viewBtn: { padding: '7px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  logoutBtn: { padding: '7px 16px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  container: { maxWidth: 1000, margin: '0 auto', padding: '28px 24px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 },
  statCard: { background: 'white', borderRadius: 14, padding: '20px 24px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #e8edf5', textAlign: 'center' },
  statNum: { fontSize: 28, fontWeight: 700, color: '#1a3c5e', marginBottom: 4 },
  statLabel: { fontSize: 13, color: '#94a3b8', fontWeight: 500 },
  tabsRow: { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  tab: { padding: '10px 18px', border: '1.5px solid #e2e8f0', borderRadius: 10, background: 'white', fontSize: 13, fontWeight: 600, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 },
  tabActive: { background: '#1a3c5e', borderColor: '#1a3c5e', color: 'white' },
  tabBadge: { background: '#f1f5f9', color: '#64748b', borderRadius: 10, padding: '1px 7px', fontSize: 12, fontWeight: 700 },
  tabBadgeActive: { background: 'rgba(255,255,255,0.2)', color: 'white' },
  panel: { background: 'white', borderRadius: 16, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e8edf5' },
  panelTitle: { fontSize: 18, fontWeight: 700, color: '#1a3c5e', marginBottom: 20 },
  loading: { color: '#94a3b8', textAlign: 'center', padding: 40 },
  emptyState: { textAlign: 'center', padding: '48px 20px', color: '#94a3b8' },
  apptList: { display: 'flex', flexDirection: 'column', gap: 12 },
  apptCard: { display: 'flex', gap: 16, alignItems: 'flex-start', background: '#f8fafc', borderRadius: 12, padding: '16px 20px', border: '1px solid #e2e8f0' },
  apptDateBox: { background: '#0ea5e9', borderRadius: 10, padding: '8px 12px', textAlign: 'center', minWidth: 52, flexShrink: 0 },
  apptDateNum: { fontSize: 22, fontWeight: 700, color: 'white', lineHeight: 1 },
  apptDateMonth: { fontSize: 11, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', marginTop: 2 },
  apptClientName: { fontSize: 15, fontWeight: 700, color: '#1a3c5e', marginBottom: 2 },
  apptClientEmail: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  apptTime: { fontSize: 13, color: '#0ea5e9', fontWeight: 600 },
  apptReason: { fontSize: 13, color: '#94a3b8', fontStyle: 'italic', marginTop: 4 },
  apptActions: { display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 },
  confirmedBadge: { background: '#dcfce7', color: '#16a34a', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 },
  cancelApptBtn: { padding: '6px 12px', background: 'transparent', color: '#ef4444', border: '1.5px solid #fecaca', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  addBox: { background: '#f8fafc', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0', marginBottom: 24 },
  subTitle: { fontSize: 15, fontWeight: 700, color: '#1a3c5e', marginBottom: 14 },
  slotForm: { display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' },
  serviceForm: { display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', gap: 12, marginBottom: 14 },
  profileForm: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: { padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: '#1a3c5e', background: 'white' },
  textarea: { width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', minHeight: 90, outline: 'none', boxSizing: 'border-box', color: '#1a3c5e' },
  addBtn: { padding: '10px 20px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  generateBtn: { padding: '9px 18px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  errorBox: { background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginTop: 10, fontSize: 13 },
  dateHeader: { fontSize: 14, fontWeight: 700, color: '#1a3c5e', textTransform: 'capitalize', padding: '8px 0', borderBottom: '1px solid #f1f5f9', marginBottom: 10 },
  slotsRow: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  slotChip: { display: 'flex', alignItems: 'center', gap: 6, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 20, padding: '6px 12px', fontSize: 13, fontWeight: 600, color: '#1d4ed8' },
  deleteSlotBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16, lineHeight: 1, padding: 0, fontWeight: 700 },
  servicesList: { display: 'flex', flexDirection: 'column', gap: 10 },
  serviceCard: { display: 'flex', alignItems: 'center', gap: 16, background: '#f8fafc', borderRadius: 12, padding: '14px 18px', border: '1px solid #e2e8f0' },
  serviceName: { fontSize: 15, fontWeight: 700, color: '#1a3c5e', marginBottom: 2 },
  serviceDesc: { fontSize: 13, color: '#64748b' },
  serviceTag: { fontSize: 12, color: '#64748b', background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '2px 8px' },
  servicePrice: { fontSize: 18, fontWeight: 700, color: '#0ea5e9', whiteSpace: 'nowrap' },
  deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '4px' },
  section: { marginBottom: 28, paddingBottom: 28, borderBottom: '1px solid #f1f5f9' },
  toggleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  toggleBtn: { padding: '8px 20px', border: '1.5px solid #e2e8f0', borderRadius: 8, background: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#64748b' },
  toggleBtnActive: { background: '#0ea5e9', borderColor: '#0ea5e9', color: 'white' },
  paymentGrid: { display: 'flex', flexWrap: 'wrap', gap: 10 },
  paymentBtn: { padding: '10px 18px', border: '1.5px solid #e2e8f0', borderRadius: 10, background: 'white', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', color: '#475569' },
  paymentBtnActive: { background: '#0ea5e9', borderColor: '#0ea5e9', color: 'white', fontWeight: 700 },
  scheduleGrid: { display: 'flex', flexDirection: 'column', gap: 10 },
  scheduleRow: { display: 'flex', alignItems: 'center', gap: 14 },
  scheduleDay: { fontSize: 14, fontWeight: 600, color: '#475569', minWidth: 80 },
  saveBtn: { padding: '12px 28px', background: '#1a3c5e', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  createBtn: { padding: '12px 28px', background: '#f1f5f9', color: '#475569', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
};
