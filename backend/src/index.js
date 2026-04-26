const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db');

const authRoutes = require('./routes/auth');
const professionalRoutes = require('./routes/professionals');
const availabilityRoutes = require('./routes/availabilities');
const appointmentRoutes = require('./routes/appointments');

const app = express();
const PORT = process.env.PORT || 5000;

const serviceRoutes = require('./routes/services');
app.use('/api/sheet', serviceRoutes);

const reviewRoutes = require('./routes/reviews');
app.use('/api/reviews', reviewRoutes);

app.use(cors());
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

const session = require('express-session');
const passport = require('./config/passport');
const oauthRoutes = require('./routes/oauth');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/professionals', professionalRoutes);
app.use('/api/availabilities', availabilityRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/auth', oauthRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Prestatio API fonctionne !' });
});

app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});