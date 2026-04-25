const express = require('express');
const router = express.Router();
const { createReview, getReviews } = require('../controllers/reviewController');
const authMiddleware = require('../middleware/auth');

router.get('/:id', getReviews);
router.post('/', authMiddleware, createReview);

module.exports = router;