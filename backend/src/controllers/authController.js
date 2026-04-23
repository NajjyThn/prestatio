const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// INSCRIPTION
const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Vérifier si l'email existe déjà
    const existing = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email déjà utilisé' });
    }

    // Chiffrer le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, role || 'client']
    );

    const user = result.rows[0];

    // Créer le token JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ user, token });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// CONNEXION
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Chercher l'utilisateur
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Email ou mot de passe incorrect' });
    }

    const user = result.rows[0];

    // Vérifier le mot de passe
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Créer le token JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// PROFIL (utilisateur connecté)
const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { register, login, getMe };