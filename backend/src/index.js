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

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/professionals', professionalRoutes);
app.use('/api/availabilities', availabilityRoutes);
app.use('/api/appointments', appointmentRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Prestatio API fonctionne !' });
});

app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});