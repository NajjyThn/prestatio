import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Home() {
  const [professionals, setProfessionals] = useState([]);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [date, setDate] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [radius, setRadius] = useState(10);
  const [useGeo, setUseGeo] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const handleClick = (e) => {
      if (cityRef.current && !cityRef.current.contains(e.target)) setShowCityDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchPros = useCallback(async (lat, lng) => {
    try {
      const params = { name: search, city };
      if (date) params.date = date;
      if (useGeo && lat && lng) { params.lat = lat; params.lng = lng; params.radius = radius; }
      const res = await api.get('/professionals', { params });
      setProfessionals(res.data);
    } catch (err) { console.error(err); }
  }, [search, city, useGeo, radius, date]);

  useEffect(() => { fetchPros(null, null); }, [fetchPros]);

  const handleGeolocate = () => {
    if (!navigator.geolocation) { alert('Géolocalisation non supportée.'); return; }
    setLocationLoading(true);
    setShowCityDropdown(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setUseGeo(true); setCity(''); setLocationLoading(false);
        fetchPros(latitude, longitude);
      },
      () => { alert('Impossible de récupérer votre position.'); setLocationLoading(false); }
    );
  };

  const today = new Date().toISOString().split('T')[0];

  const features = [
    { icon: '📅', title: 'Réservation simple', desc: 'Prenez rendez-vous en ligne 24h/24 et 7j/7' },
    { icon: '💆‍♀️', title: 'Expertes qualifiées', desc: 'Des professionnelles sélectionnées avec soin' },
    { icon: '🔒', title: 'Paiement sécurisé', desc: 'Vos paiements sont sécurisés et protégés' },
    { icon: '🔔', title: 'Rappels automatiques', desc: 'Ne manquez plus jamais votre rendez-vous' },
  ];

  return (
    <div style={{ fontFamily: "'Cormorant Garamond', 'Georgia', serif", background: '#fff9f9', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .pro-card:hover { transform: translateY(-6px) !important; box-shadow: 0 20px 48px rgba(232,100,140,0.18) !important; }
        .nav-link:hover { color: #e8648c !important; }
        .pink-btn:hover { background: #d4547a !important; transform: translateY(-1px); }
        .outline-btn:hover { background: #fdf2f5 !important; }
        .feature-card:hover { border-color: #e8648c !important; }
        input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; filter: invert(40%) sepia(80%) saturate(400%) hue-rotate(300deg); }
        input[type="date"] { color-scheme: light; }
        .geo-option:hover { background: #fff0f4 !important; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.6s ease forwards; }
      `}</style>

      {/* NAVBAR */}
      <nav style={S.navbar}>
        <div style={S.navLogo}>Presta<span style={{ color: '#e8648c' }}>&</span>You</div>
        <div style={S.navLinks}>
          {['Accueil', 'Professionnelles', 'Prestations', 'À propos', 'Blog'].map((l, i) => (
            <span key={l} className="nav-link" style={{ ...S.navLink, color: i === 0 ? '#e8648c' : '#1a1a1a', borderBottom: i === 0 ? '2px solid #e8648c' : 'none', paddingBottom: 2 }}>{l}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {user ? (
            <>
              <span style={{ fontSize: 14, color: '#666', fontFamily: 'DM Sans' }}>Bonjour, {user.name?.split(' ')[0]} 👋</span>
              <button className="outline-btn" style={S.outlineBtn} onClick={() => navigate(user.role === 'professional' ? '/pro' : '/dashboard')}>Mon espace</button>
            </>
          ) : (
            <>
              <button className="outline-btn" style={S.outlineBtn} onClick={() => navigate('/login')}>Se connecter</button>
              <button className="pink-btn" style={S.pinkBtn} onClick={() => navigate('/register')}>Prendre rendez-vous</button>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <div style={S.hero}>
        <div style={S.heroLeft} className="fade-up">
          <div style={S.heroEyebrow}>✨ Les prestaires autour de chez vous d'un simple clic !</div>
          <h1 style={S.heroTitle}>
            Prenez rendez-vous avec les meilleures<br />
            <span style={{ color: '#e8648c', fontStyle: 'italic' }}>prestataires</span>
          </h1>
          <p style={S.heroSub}>Réservez en quelques clics la prestation qu'il vous faut.</p>
          <div style={S.heroSocial}>
            <div style={S.avatarStack}>
              {['#f4c2c2','#f9a8d4','#e879a0','#c2185b'].map((c,i) => (
                <div key={i} style={{ ...S.avatarCircle, background: c, marginLeft: i > 0 ? -10 : 0, zIndex: 4-i }} />
              ))}
            </div>
            <div>
              <div style={S.socialNum}>+10 000 clientes</div>
              <div style={S.socialLabel}>nous font déjà confiance</div>
            </div>
            <div style={S.heartBadge}>♥</div>
          </div>
        </div>
        <div style={S.heroRight}>
          <div style={S.heroImgPlaceholder}>
            <div style={S.heroImgInner}>
              <div style={{ fontSize: 80 }}>💄</div>
              <div style={{ fontSize: 24, color: '#e8648c', fontWeight: 600, marginTop: 8 }}>Beauté & Élégance</div>
            </div>
          </div>
        </div>
      </div>

      {/* BARRE DE RECHERCHE */}
      <div style={S.searchWrapper}>
        <div style={S.searchBar}>
          {/* Prestation */}
          <div style={S.searchField}>
            <span style={S.searchFieldIcon}>✂️</span>
            <div style={{ flex: 1 }}>
              <div style={S.searchFieldLabel}>Quelle prestation ?</div>
              <input style={S.searchInput} placeholder="Ex : Maquillage mariée"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <span style={S.chevron}>▾</span>
          </div>
          <div style={S.searchDivider} />

          {/* Ville */}
          <div style={{ ...S.searchField, position: 'relative' }} ref={cityRef}>
            <span style={S.searchFieldIcon}>📍</span>
            <div style={{ flex: 1 }}>
              <div style={S.searchFieldLabel}>Où ?</div>
              {useGeo ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600, fontFamily: 'DM Sans' }}>
                    {locationLoading ? 'Localisation...' : '✅ Autour de moi'}
                  </span>
                  <button style={S.clearBtn} onClick={() => { setUseGeo(false); setUserLocation(null); setCity(''); }}>×</button>
                </div>
              ) : (
                <input style={S.searchInput} placeholder="Ville ou code postal"
                  value={city}
                  onChange={e => { setCity(e.target.value); setUseGeo(false); }}
                  onFocus={() => setShowCityDropdown(true)} />
              )}
            </div>
            <span style={S.chevron}>▾</span>

            {showCityDropdown && !useGeo && (
              <div style={S.dropdown}>
                <div style={S.dropSection}>Saisir une ville</div>
                <div style={S.dropRow}>
                  <span>🏙️</span>
                  <span style={{ fontSize: 13, color: city ? '#1a1a1a' : '#aaa', fontFamily: 'DM Sans' }}>
                    {city || 'Tapez une ville...'}
                  </span>
                </div>
                <div style={S.dropDivider} />
                <div style={S.dropSection}>Ou utiliser ma position</div>
                <button className="geo-option" style={S.geoOption} onClick={handleGeolocate} disabled={locationLoading}>
                  <div style={S.geoIconBox}>📍</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', fontFamily: 'DM Sans' }}>
                      {locationLoading ? 'Localisation...' : 'Me localiser automatiquement'}
                    </div>
                    <div style={{ fontSize: 12, color: '#999', fontFamily: 'DM Sans', marginTop: 2 }}>
                      Trouver les pros autour de vous
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
          <div style={S.searchDivider} />

          {/* Date */}
          <div style={S.searchField}>
            <span style={S.searchFieldIcon}>📅</span>
            <div style={{ flex: 1 }}>
              <div style={S.searchFieldLabel}>Quand ?</div>
              <input style={{ ...S.searchInput, cursor: 'pointer' }} type="date"
                min={today} value={date} onChange={e => setDate(e.target.value)} />
            </div>
            {date && <button style={S.clearBtn} onClick={() => setDate('')}>×</button>}
          </div>

          <button className="pink-btn" style={S.searchBtn}
            onClick={() => fetchPros(userLocation?.lat, userLocation?.lng)}>
            🔍 Rechercher
          </button>
        </div>

        {useGeo && (
          <div style={S.radiusRow}>
            <span style={{ fontSize: 13, color: '#888', fontFamily: 'DM Sans' }}>Rayon :</span>
            {[5, 10, 20, 50].map(r => (
              <button key={r}
                style={{ ...S.radiusBtn, ...(radius === r ? S.radiusBtnActive : {}) }}
                onClick={() => { setRadius(r); fetchPros(userLocation?.lat, userLocation?.lng); }}
              >{r} km</button>
            ))}
          </div>
        )}
      </div>

      {/* FEATURES */}
      <div style={S.features}>
        {features.map(f => (
          <div key={f.title} className="feature-card" style={S.featureCard}>
            <div style={S.featureIcon}>{f.icon}</div>
            <div style={S.featureTitle}>{f.title}</div>
            <div style={S.featureDesc}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* PROFESSIONNELLES */}
      <div style={S.section}>
        <div style={S.sectionHeader}>
          <div>
            <h2 style={S.sectionTitle}>Nos professionnelles</h2>
            <div style={S.sectionUnderline} />
          </div>
          <button style={S.seeAll} onClick={() => fetchPros(null, null)}>
            Voir toutes les professionnelles →
          </button>
        </div>

        {professionals.length === 0 ? (
          <div style={S.empty}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💄</div>
            <p style={{ fontSize: 16, color: '#999', fontFamily: 'DM Sans' }}>Aucune professionnelle trouvée.</p>
          </div>
        ) : (
          <div style={S.proGrid}>
            {professionals.map(pro => (
              <div key={pro.id} className="pro-card" style={S.proCard}>
                <div style={S.proAvatar}>
                  <div style={{ ...S.proAvatarInner, background: stringToColor(pro.name) }}>
                    {pro.name?.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div style={S.proInfo}>
                  <div style={S.proName}>{pro.name}</div>
                  <div style={S.proSpecialty}>{pro.specialty}</div>
                  {pro.average_rating > 0 && (
                    <div style={S.proRating}>
                      <span style={{ color: '#e8648c' }}>★</span>
                      <span style={S.ratingNum}>{parseFloat(pro.average_rating).toFixed(1)}</span>
                      <span style={S.ratingCount}>({pro.review_count} avis)</span>
                    </div>
                  )}
                  {pro.city && <div style={S.proCity}>📍 {pro.city}</div>}
                  {pro.bio && <p style={S.proBio}>{pro.bio.slice(0, 70)}{pro.bio.length > 70 ? '...' : ''}</p>}
                  <button className="outline-btn" style={S.proBtn}
                    onClick={() => navigate(`/professional/${pro.id}`)}>
                    Voir le profil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BANNIÈRE CTA */}
      <div style={S.ctaBanner}>
        <div style={S.ctaContent}>
          <h2 style={S.ctaTitle}>Sublimez chaque moment ✨</h2>
          <p style={S.ctaSub}>Réservez votre prochaine prestation et profitez d'une expérience unique.</p>
          <button className="pink-btn" style={{ ...S.pinkBtn, padding: '14px 32px', fontSize: 15 }}
            onClick={() => navigate('/register')}>
            Découvrir nos prestations
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={S.footer}>
        <div style={S.footerLogo}>Presta<span style={{ color: '#e8648c' }}>&</span>You</div>
        <div style={S.footerSub}>Prestation sur rendez-vous !</div>
        <div style={S.footerLinks}>
          {['Mentions légales', 'CGU', 'Contact', 'FAQ'].map(l => (
            <span key={l} style={S.footerLink}>{l}</span>
          ))}
        </div>
      </footer>
    </div>
  );
}

function stringToColor(str = '') {
  const colors = ['#e8648c', '#c2185b', '#e91e8c', '#ad1457', '#880e4f', '#f06292', '#ec407a'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

const S = {
  navbar: { background: 'white', padding: '0 48px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #fce4ec', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 16px rgba(232,100,140,0.07)' },
  navLogo: { fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.5px' },
  navLinks: { display: 'flex', gap: 32, alignItems: 'center' },
  navLink: { fontSize: 14, fontFamily: 'DM Sans, sans-serif', fontWeight: 500, cursor: 'pointer', transition: 'color 0.2s' },
  outlineBtn: { padding: '9px 20px', background: 'white', border: '1.5px solid #e8648c', borderRadius: 50, fontSize: 13, fontWeight: 600, color: '#e8648c', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s' },
  pinkBtn: { padding: '10px 22px', background: '#e8648c', border: 'none', borderRadius: 50, fontSize: 14, fontWeight: 600, color: 'white', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(232,100,140,0.35)' },

  hero: { display: 'flex', alignItems: 'center', padding: '64px 48px', maxWidth: 1200, margin: '0 auto', gap: 48, minHeight: 480 },
  heroLeft: { flex: 1 },
  heroEyebrow: { fontSize: 13, fontFamily: 'DM Sans', fontWeight: 600, color: '#e8648c', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 },
  heroTitle: { fontSize: 52, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.15, marginBottom: 20 },
  heroSub: { fontSize: 16, fontFamily: 'DM Sans', color: '#666', lineHeight: 1.6, marginBottom: 32, maxWidth: 460 },
  heroSocial: { display: 'flex', alignItems: 'center', gap: 14 },
  avatarStack: { display: 'flex', alignItems: 'center' },
  avatarCircle: { width: 36, height: 36, borderRadius: '50%', border: '2px solid white' },
  socialNum: { fontSize: 15, fontWeight: 700, color: '#1a1a1a', fontFamily: 'DM Sans' },
  socialLabel: { fontSize: 13, color: '#888', fontFamily: 'DM Sans' },
  heartBadge: { width: 36, height: 36, borderRadius: '50%', background: '#fce4ec', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e8648c', fontSize: 16 },
  heroRight: { flex: 1, display: 'flex', justifyContent: 'center' },
  heroImgPlaceholder: { width: 420, height: 380, borderRadius: 24, background: 'linear-gradient(135deg, #fce4ec, #f8bbd0, #fce4ec)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 24px 64px rgba(232,100,140,0.2)' },
  heroImgInner: { textAlign: 'center' },

  searchWrapper: { background: 'white', padding: '0 48px 32px', maxWidth: 1200, margin: '0 auto' },
  searchBar: { display: 'flex', alignItems: 'center', background: 'white', borderRadius: 16, border: '1.5px solid #fce4ec', boxShadow: '0 8px 32px rgba(232,100,140,0.1)', overflow: 'visible', padding: '8px 8px 8px 0' },
  searchField: { display: 'flex', alignItems: 'center', flex: 1, padding: '8px 20px', gap: 10, minWidth: 0 },
  searchFieldIcon: { fontSize: 18, flexShrink: 0 },
  searchFieldLabel: { fontSize: 11, fontWeight: 700, color: '#e8648c', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'DM Sans', marginBottom: 2 },
  searchInput: { border: 'none', outline: 'none', fontSize: 14, color: '#1a1a1a', fontFamily: 'DM Sans', background: 'transparent', width: '100%', padding: '2px 0' },
  searchDivider: { width: 1, height: 40, background: '#fce4ec', flexShrink: 0 },
  chevron: { color: '#e8648c', fontSize: 14, flexShrink: 0 },
  searchBtn: { padding: '14px 28px', background: '#e8648c', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans', flexShrink: 0, marginLeft: 6, whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(232,100,140,0.35)' },
  clearBtn: { background: '#fce4ec', border: 'none', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, color: '#e8648c', flexShrink: 0, padding: 0 },
  dropdown: { position: 'absolute', top: 'calc(100% + 10px)', left: -20, right: -20, background: 'white', borderRadius: 16, boxShadow: '0 16px 48px rgba(232,100,140,0.15)', border: '1.5px solid #fce4ec', zIndex: 50, overflow: 'hidden' },
  dropSection: { fontSize: 11, fontWeight: 700, color: '#e8648c', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '10px 16px 6px', fontFamily: 'DM Sans' },
  dropRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px 10px', minHeight: 36, fontFamily: 'DM Sans' },
  dropDivider: { height: 1, background: '#fce4ec', margin: '4px 0' },
  geoOption: { display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'DM Sans', transition: 'background 0.15s' },
  geoIconBox: { width: 38, height: 38, borderRadius: 10, background: '#fce4ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 },
  radiusRow: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, paddingLeft: 4 },
  radiusBtn: { padding: '5px 14px', borderRadius: 20, border: '1.5px solid #fce4ec', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: 'white', color: '#888', fontFamily: 'DM Sans', transition: 'all 0.15s' },
  radiusBtnActive: { background: '#e8648c', borderColor: '#e8648c', color: 'white' },

  features: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, padding: '40px 48px', maxWidth: 1200, margin: '0 auto' },
  featureCard: { background: 'white', borderRadius: 16, padding: '24px 20px', border: '1.5px solid #fce4ec', textAlign: 'center', transition: 'border-color 0.2s' },
  featureIcon: { width: 48, height: 48, borderRadius: '50%', background: '#fce4ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, margin: '0 auto 12px' },
  featureTitle: { fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 6, fontFamily: 'DM Sans' },
  featureDesc: { fontSize: 13, color: '#888', fontFamily: 'DM Sans', lineHeight: 1.5 },

  section: { padding: '32px 48px 56px', maxWidth: 1200, margin: '0 auto' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 },
  sectionTitle: { fontSize: 32, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 },
  sectionUnderline: { width: 48, height: 3, background: '#e8648c', borderRadius: 2 },
  seeAll: { fontSize: 14, color: '#e8648c', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans' },
  empty: { textAlign: 'center', padding: '64px 20px' },
  proGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 },
  proCard: { background: 'white', borderRadius: 20, overflow: 'hidden', border: '1.5px solid #fce4ec', transition: 'transform 0.25s, box-shadow 0.25s', boxShadow: '0 4px 16px rgba(232,100,140,0.06)' },
  proAvatar: { height: 180, background: 'linear-gradient(135deg, #fce4ec, #f8bbd0)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  proAvatarInner: { width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, color: 'white', border: '3px solid white', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' },
  proInfo: { padding: '18px 20px 20px' },
  proName: { fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 3 },
  proSpecialty: { fontSize: 13, color: '#e8648c', fontWeight: 600, fontFamily: 'DM Sans', marginBottom: 8 },
  proRating: { display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 },
  ratingNum: { fontSize: 13, fontWeight: 700, color: '#1a1a1a', fontFamily: 'DM Sans' },
  ratingCount: { fontSize: 12, color: '#aaa', fontFamily: 'DM Sans' },
  proCity: { fontSize: 12, color: '#999', fontFamily: 'DM Sans', marginBottom: 8 },
  proBio: { fontSize: 13, color: '#666', fontFamily: 'DM Sans', lineHeight: 1.5, marginBottom: 14 },
  proBtn: { width: '100%', padding: '10px', background: 'white', border: '1.5px solid #e8648c', borderRadius: 50, fontSize: 13, fontWeight: 600, color: '#e8648c', cursor: 'pointer', fontFamily: 'DM Sans', transition: 'all 0.2s', textAlign: 'center' },

  ctaBanner: { margin: '0 48px 56px', borderRadius: 24, background: 'linear-gradient(135deg, #1a1a1a 0%, #2d1a20 50%, #3d1a2a 100%)', padding: '48px', textAlign: 'center', maxWidth: 1104, marginLeft: 'auto', marginRight: 'auto' },
  ctaContent: {},
  ctaTitle: { fontSize: 36, fontWeight: 700, color: 'white', marginBottom: 12 },
  ctaSub: { fontSize: 16, color: 'rgba(255,255,255,0.7)', fontFamily: 'DM Sans', marginBottom: 28 },

  footer: { background: 'white', borderTop: '1px solid #fce4ec', padding: '32px 48px', textAlign: 'center' },
  footerLogo: { fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 },
  footerSub: { fontSize: 12, color: '#aaa', fontFamily: 'DM Sans', marginBottom: 16 },
  footerLinks: { display: 'flex', gap: 28, justifyContent: 'center' },
  footerLink: { fontSize: 13, color: '#888', fontFamily: 'DM Sans', cursor: 'pointer' },
};
