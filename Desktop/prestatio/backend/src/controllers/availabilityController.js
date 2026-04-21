const pool = require('../config/db');

// Voir les disponibilités d'un professionnel
const getAvailabilities = async (req, res) => {
  const { id } = req.params; // professional_id
  const { date } = req.query;

  try {
    let query = `
      SELECT * FROM availabilities
      WHERE professional_id = $1
      AND is_booked = FALSE
      AND date >= CURRENT_DATE
    `;
    const params = [id];

    if (date) {
      query += ` AND date = $2`;
      params.push(date);
    }

    query += ' ORDER BY date, start_time';

    const result = await pool.query(query, params);
    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Ajouter des disponibilités (professionnel connecté)
const addAvailability = async (req, res) => {
  const { date, start_time, end_time } = req.body;
  const user_id = req.user.id;

  try {
    // Récupérer le profil pro de l'utilisateur connecté
    const proResult = await pool.query(
      'SELECT * FROM professionals WHERE user_id = $1', [user_id]
    );
    if (proResult.rows.length === 0) {
      return res.status(404).json({ error: 'Profil professionnel introuvable' });
    }

    const professional_id = proResult.rows[0].id;

    // Vérifier qu'il n'y a pas déjà un créneau qui se chevauche
    const conflict = await pool.query(`
      SELECT * FROM availabilities
      WHERE professional_id = $1
      AND date = $2
      AND (
        (start_time < $4 AND end_time > $3)
      )
    `, [professional_id, date, start_time, end_time]);

    if (conflict.rows.length > 0) {
      return res.status(400).json({ error: 'Ce créneau chevauche une disponibilité existante' });
    }

    const result = await pool.query(`
      INSERT INTO availabilities (professional_id, date, start_time, end_time)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [professional_id, date, start_time, end_time]);

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Supprimer une disponibilité
const deleteAvailability = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    const proResult = await pool.query(
      'SELECT * FROM professionals WHERE user_id = $1', [user_id]
    );
    if (proResult.rows.length === 0) {
      return res.status(404).json({ error: 'Profil professionnel introuvable' });
    }

    const professional_id = proResult.rows[0].id;

    const result = await pool.query(`
      DELETE FROM availabilities
      WHERE id = $1 AND professional_id = $2 AND is_booked = FALSE
      RETURNING *
    `, [id, professional_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Créneau introuvable ou déjà réservé' });
    }

    res.json({ message: 'Créneau supprimé' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  getAvailabilities,
  addAvailability,
  deleteAvailability
};