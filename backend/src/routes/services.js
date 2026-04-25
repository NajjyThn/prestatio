const express = require('express');
const router = express.Router();
const { getProSheet, addService, deleteService, saveProInfo } = require('../controllers/serviceController');
const authMiddleware = require('../middleware/auth');

router.get('/:id', getProSheet);
router.post('/service', authMiddleware, addService);
router.delete('/service/:id', authMiddleware, deleteService);
router.post('/info', authMiddleware, saveProInfo);

module.exports = router;