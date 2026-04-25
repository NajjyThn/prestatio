const pool = require('../config/db');

// Lister tous les professionnels (avec filtres)
const getProfessionals = async (req, res) => {
  const { city, specialty, name, lat, lng, radius } = req.query;

  try {
    let query = `
      SELECT p.*, u.name, u.email
      FROM professionals p
      JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;

    if (city) {
      query += ` AND LOWER(p.city) LIKE LOWER($${i++})`;
      params.push(`%${city}%`);
    }
    if (specialty) {
      query += ` AND LOWER(p.specialty) LIKE LOWER($${i++})`;
      params.push(`%${specialty}%`);
    }
    if (name) {
      query += ` AND LOWER(u.name) LIKE LOWER($${i++})`;
      params.push(`%${name}%`);
    }

    // Filtre par rayon GPS (en km)
    if (lat && lng && radius) {
      query += `
        AND (
          6371 * acos(
            cos(radians($${i++})) * cos(radians(p.latitude)) *
            cos(radians(p.longitude) - radians($${i++})) +
            sin(radians($${i++})) * sin(radians(p.latitude))
          )
        ) <= $${i++}
      `;
      params.push(parseFloat(lat), parseFloat(lng), parseFloat(lat), parseFloat(radius));
    }

    query += ' ORDER BY p.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer un professionnel par ID
const getProfessionalById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT p.*, u.name, u.email
      FROM professionals p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Professionnel introuvable' });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Créer un profil professionnel
const createProfessional = async (req, res) => {
  const { specialty, city, address, bio, latitude, longitude } = req.body;
  const user_id = req.user.id;

  try {
    const existing = await pool.query(
      'SELECT * FROM professionals WHERE user_id = $1', [user_id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Profil professionnel déjà existant' });
    }

    const result = await pool.query(`
      INSERT INTO professionals (user_id, specialty, city, address, bio, latitude, longitude)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [user_id, specialty, city, address, bio, latitude, longitude]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const updateProfessional = async (req, res) => {
  const { specialty, city, address, bio, latitude, longitude } = req.body;
  const user_id = req.user.id;

  try {
    const result = await pool.query(`
      UPDATE professionals
      SET specialty=$1, city=$2, address=$3, bio=$4, latitude=$5, longitude=$6
      WHERE user_id=$7
      RETURNING *
    `, [specialty, city, address, bio, latitude, longitude, user_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profil introuvable' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};



module.exports = {
  getProfessionals,
  getProfessionalById,
  createProfessional,
  updateProfessional
};