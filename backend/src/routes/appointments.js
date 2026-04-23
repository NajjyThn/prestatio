const express = require('express');
const router = express.Router();
const {
  createAppointment,
  getMyAppointments,
  getProAppointments,
  cancelAppointment
} = require('../controllers/appointmentController');
const authMiddleware = require('../middleware/auth');

// Toutes les routes sont protégées
router.post('/', authMiddleware, createAppointment);
router.get('/my', authMiddleware, getMyAppointments);
router.get('/pro', authMiddleware, getProAppointments);
router.put('/cancel/:id', authMiddleware, cancelAppointment);

module.exports = router;