const express = require('express');
const router = express.Router();
const {
  getProfessionals,
  getProfessionalById,
  createProfessional,
  updateProfessional
} = require('../controllers/professionalController');
const authMiddleware = require('../middleware/auth');

// Routes publiques
router.get('/', getProfessionals);
router.get('/:id', getProfessionalById);

// Routes protégées (connecté)
router.post('/', authMiddleware, createProfessional);
router.put('/', authMiddleware, updateProfessional);

module.exports = router;