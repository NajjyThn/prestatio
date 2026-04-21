const pool = require('../config/db');

// Réserver un créneau
const createAppointment = async (req, res) => {
  const { professional_id, availability_id, reason } = req.body;
  const client_id = req.user.id;

  try {
    // Vérifier que le créneau existe et est libre
    const slot = await pool.query(`
      SELECT * FROM availabilities
      WHERE id = $1
      AND professional_id = $2
      AND is_booked = FALSE
    `, [availability_id, professional_id]);

    if (slot.rows.length === 0) {
      return res.status(400).json({ error: 'Créneau indisponible ou déjà réservé' });
    }

    // Vérifier que le client n'a pas déjà un RDV sur ce créneau
    const alreadyBooked = await pool.query(`
      SELECT * FROM appointments
      WHERE client_id = $1
      AND availability_id = $2
    `, [client_id, availability_id]);

    if (alreadyBooked.rows.length > 0) {
      return res.status(400).json({ error: 'Vous avez déjà réservé ce créneau' });
    }

    // Créer le rendez-vous
    const appointment = await pool.query(`
      INSERT INTO appointments (client_id, professional_id, availability_id, reason)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [client_id, professional_id, availability_id, reason]);

    // Marquer le créneau comme réservé
    await pool.query(`
      UPDATE availabilities SET is_booked = TRUE WHERE id = $1
    `, [availability_id]);

    res.status(201).json(appointment.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Voir ses rendez-vous (client)
const getMyAppointments = async (req, res) => {
  const client_id = req.user.id;

  try {
    const result = await pool.query(`
      SELECT
        a.*,
        u.name AS professional_name,
        p.specialty,
        p.city,
        p.address,
        av.date,
        av.start_time,
        av.end_time
      FROM appointments a
      JOIN professionals p ON a.professional_id = p.id
      JOIN users u ON p.user_id = u.id
      JOIN availabilities av ON a.availability_id = av.id
      WHERE a.client_id = $1
      ORDER BY av.date DESC, av.start_time DESC
    `, [client_id]);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Voir ses rendez-vous (professionnel)
const getProAppointments = async (req, res) => {
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
      SELECT
        a.*,
        u.name AS client_name,
        u.email AS client_email,
        av.date,
        av.start_time,
        av.end_time
      FROM appointments a
      JOIN users u ON a.client_id = u.id
      JOIN availabilities av ON a.availability_id = av.id
      WHERE a.professional_id = $1
      ORDER BY av.date ASC, av.start_time ASC
    `, [professional_id]);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Annuler un rendez-vous
const cancelAppointment = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    // Récupérer le RDV
    const appt = await pool.query(
      'SELECT * FROM appointments WHERE id = $1', [id]
    );
    if (appt.rows.length === 0) {
      return res.status(404).json({ error: 'Rendez-vous introuvable' });
    }

    const appointment = appt.rows[0];

    // Vérifier que c'est bien le client ou le pro
    const proResult = await pool.query(
      'SELECT * FROM professionals WHERE user_id = $1', [user_id]
    );
    const isClient = appointment.client_id === user_id;
    const isPro = proResult.rows.length > 0 &&
      proResult.rows[0].id === appointment.professional_id;

    if (!isClient && !isPro) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    // Annuler le RDV
    await pool.query(
      'UPDATE appointments SET status = $1 WHERE id = $2',
      ['cancelled', id]
    );

    // Libérer le créneau
    await pool.query(
      'UPDATE availabilities SET is_booked = FALSE WHERE id = $1',
      [appointment.availability_id]
    );

    res.json({ message: 'Rendez-vous annulé' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  createAppointment,
  getMyAppointments,
  getProAppointments,
  cancelAppointment
};