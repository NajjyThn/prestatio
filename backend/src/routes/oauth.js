const express = require('express');
const router = express.Router();
const passport = require('../config/passport');

// ===== GOOGLE =====
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=google` }),
  (req, res) => {
    const { user, token } = req.user;
    // Redirige vers le frontend avec le token dans l'URL
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({ id: user.id, name: user.name, email: user.email, role: user.role }))}`
    );
  }
);

module.exports = router;