const express = require('express');
const router = express.Router();
const {
  getAvailabilities,
  addAvailability,
  deleteAvailability
} = require('../controllers/availabilityController');
const authMiddleware = require('../middleware/auth');

// Routes publiques
router.get('/:id', getAvailabilities);

// Routes protégées
router.post('/', authMiddleware, addAvailability);
router.delete('/:id', authMiddleware, deleteAvailability);

module.exports = router;