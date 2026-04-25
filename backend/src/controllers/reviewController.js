const pool = require('../config/db');

// Laisser un avis
const createReview = async (req, res) => {
  const { professional_id, appointment_id, rating, comment } = req.body;
  const client_id = req.user.id;

  try {
    // Vérifier que le RDV appartient au client et est confirmé
    const appt = await pool.query(`
      SELECT * FROM appointments
      WHERE id = $1 AND client_id = $2 AND status = 'confirmed'
    `, [appointment_id, client_id]);

    if (appt.rows.length === 0) {
      return res.status(400).json({ error: 'Rendez-vous introuvable ou non autorisé' });
    }

    // Vérifier qu'il n'a pas déjà noté ce RDV
    const existing = await pool.query(`
      SELECT * FROM reviews WHERE client_id = $1 AND appointment_id = $2
    `, [client_id, appointment_id]);

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Vous avez déjà noté ce rendez-vous' });
    }

    const result = await pool.query(`
      INSERT INTO reviews (client_id, professional_id, appointment_id, rating, comment)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [client_id, professional_id, appointment_id, rating, comment]);

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer les avis d'un professionnel
const getReviews = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT r.*, u.name AS client_name
      FROM reviews r
      JOIN users u ON r.client_id = u.id
      WHERE r.professional_id = $1
      ORDER BY r.created_at DESC
    `, [id]);

    const stats = await pool.query(`
      SELECT
        ROUND(AVG(rating)::numeric, 1) AS average,
        COUNT(*) AS total,
        COUNT(CASE WHEN rating = 5 THEN 1 END) AS five,
        COUNT(CASE WHEN rating = 4 THEN 1 END) AS four,
        COUNT(CASE WHEN rating = 3 THEN 1 END) AS three,
        COUNT(CASE WHEN rating = 2 THEN 1 END) AS two,
        COUNT(CASE WHEN rating = 1 THEN 1 END) AS one
      FROM reviews WHERE professional_id = $1
    `, [id]);

    res.json({ reviews: result.rows, stats: stats.rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { createReview, getReviews };