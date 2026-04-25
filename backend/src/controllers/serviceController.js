const pool = require('../config/db');

// Récupérer la fiche complète d'un pro (services + infos pratiques)
const getProSheet = async (req, res) => {
  const { id } = req.params;

  try {
    const [services, info] = await Promise.all([
      pool.query('SELECT * FROM services WHERE professional_id = $1 ORDER BY price ASC', [id]),
      pool.query('SELECT * FROM professional_info WHERE professional_id = $1', [id])
    ]);

    res.json({
      services: services.rows,
      info: info.rows[0] || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Ajouter un service
const addService = async (req, res) => {
  const { name, description, price, duration_minutes } = req.body;
  const user_id = req.user.id;

  try {
    const proResult = await pool.query(
      'SELECT * FROM professionals WHERE user_id = $1', [user_id]
    );
    if (proResult.rows.length === 0) {
      return res.status(404).json({ error: 'Profil professionnel introuvable' });
    }

    const result = await pool.query(`
      INSERT INTO services (professional_id, name, description, price, duration_minutes)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [proResult.rows[0].id, name, description, price, duration_minutes]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Supprimer un service
const deleteService = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    const proResult = await pool.query(
      'SELECT * FROM professionals WHERE user_id = $1', [user_id]
    );
    if (proResult.rows.length === 0) {
      return res.status(404).json({ error: 'Profil introuvable' });
    }

    await pool.query(
      'DELETE FROM services WHERE id = $1 AND professional_id = $2',
      [id, proResult.rows[0].id]
    );

    res.json({ message: 'Service supprimé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Sauvegarder les infos pratiques
const saveProInfo = async (req, res) => {
  const { requires_deposit, deposit_amount, payment_methods, schedule, notes } = req.body;
  const user_id = req.user.id;

  try {
    const proResult = await pool.query(
      'SELECT * FROM professionals WHERE user_id = $1', [user_id]
    );
    if (proResult.rows.length === 0) {
      return res.status(404).json({ error: 'Profil introuvable' });
    }

    const professional_id = proResult.rows[0].id;

    const result = await pool.query(`
      INSERT INTO professional_info
        (professional_id, requires_deposit, deposit_amount, payment_methods, schedule, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (professional_id) DO UPDATE SET
        requires_deposit = $2,
        deposit_amount = $3,
        payment_methods = $4,
        schedule = $5,
        notes = $6
      RETURNING *
    `, [professional_id, requires_deposit, deposit_amount, payment_methods, JSON.stringify(schedule), notes]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { getProSheet, addService, deleteService, saveProInfo };