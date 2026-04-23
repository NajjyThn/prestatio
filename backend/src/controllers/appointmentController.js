const pool = require('../config/db');
const {
  sendConfirmationToClient,
  sendNotificationToPro,
  sendCancellationEmail
} = require('../services/emailService');

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
};

const formatTime = (timeStr) => timeStr?.slice(0, 5);

// Réserver un créneau
const createAppointment = async (req, res) => {
  const { professional_id, availability_id, reason } = req.body;
  const client_id = req.user.id;

  try {
    const slot = await pool.query(`
      SELECT * FROM availabilities
      WHERE id = $1 AND professional_id = $2 AND is_booked = FALSE
    `, [availability_id, professional_id]);

    if (slot.rows.length === 0) {
      return res.status(400).json({ error: 'Créneau indisponible ou déjà réservé' });
    }

    const alreadyBooked = await pool.query(`
      SELECT * FROM appointments WHERE client_id = $1 AND availability_id = $2
    `, [client_id, availability_id]);

    if (alreadyBooked.rows.length > 0) {
      return res.status(400).json({ error: 'Vous avez déjà réservé ce créneau' });
    }

    const appointment = await pool.query(`
      INSERT INTO appointments (client_id, professional_id, availability_id, reason)
      VALUES ($1, $2, $3, $4) RETURNING *
    `, [client_id, professional_id, availability_id, reason]);

    await pool.query(
      'UPDATE availabilities SET is_booked = TRUE WHERE id = $1',
      [availability_id]
    );

    // Récupérer les infos pour les emails
    const infoResult = await pool.query(`
      SELECT
        u_client.name AS client_name, u_client.email AS client_email,
        u_pro.name AS pro_name, u_pro.email AS pro_email,
        p.address, p.city,
        av.date, av.start_time
      FROM appointments a
      JOIN users u_client ON a.client_id = u_client.id
      JOIN professionals p ON a.professional_id = p.id
      JOIN users u_pro ON p.user_id = u_pro.id
      JOIN availabilities av ON a.availability_id = av.id
      WHERE a.id = $1
    `, [appointment.rows[0].id]);

    const info = infoResult.rows[0];
    const dateFormatted = formatDate(info.date);
    const timeFormatted = formatTime(info.start_time);

    // Envoyer les deux emails en parallèle
    await Promise.all([
      sendConfirmationToClient({
        clientName: info.client_name,
        clientEmail: info.client_email,
        proName: info.pro_name,
        date: dateFormatted,
        time: timeFormatted,
        address: `${info.address || ''} ${info.city}`
      }),
      sendNotificationToPro({
        proName: info.pro_name,
        proEmail: info.pro_email,
        clientName: info.client_name,
        date: dateFormatted,
        time: timeFormatted,
        reason: reason || ''
      })
    ]);

    res.status(201).json(appointment.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Voir ses RDV (client)
const getMyAppointments = async (req, res) => {
  const client_id = req.user.id;
  try {
    const result = await pool.query(`
      SELECT a.*, u.name AS professional_name, p.specialty, p.city, p.address,
        av.date, av.start_time, av.end_time
      FROM appointments a
      JOIN professionals p ON a.professional_id = p.id
      JOIN users u ON p.user_id = u.id
      JOIN availabilities av ON a.availability_id = av.id
      WHERE a.client_id = $1
      ORDER BY av.date DESC, av.start_time DESC
    `, [client_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Voir ses RDV (professionnel)
const getProAppointments = async (req, res) => {
  const user_id = req.user.id;
  try {
    const proResult = await pool.query(
      'SELECT * FROM professionals WHERE user_id = $1', [user_id]
    );
    if (proResult.rows.length === 0) {
      return res.status(404).json({ error: 'Profil professionnel introuvable' });
    }
    const result = await pool.query(`
      SELECT a.*, u.name AS client_name, u.email AS client_email,
        av.date, av.start_time, av.end_time
      FROM appointments a
      JOIN users u ON a.client_id = u.id
      JOIN availabilities av ON a.availability_id = av.id
      WHERE a.professional_id = $1
      ORDER BY av.date ASC, av.start_time ASC
    `, [proResult.rows[0].id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Annuler un RDV
const cancelAppointment = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    const appt = await pool.query(`
      SELECT a.*, u_client.name AS client_name, u_client.email AS client_email,
        u_pro.name AS pro_name, u_pro.email AS pro_email,
        av.date, av.start_time
      FROM appointments a
      JOIN users u_client ON a.client_id = u_client.id
      JOIN professionals p ON a.professional_id = p.id
      JOIN users u_pro ON p.user_id = u_pro.id
      JOIN availabilities av ON a.availability_id = av.id
      WHERE a.id = $1
    `, [id]);

    if (appt.rows.length === 0) {
      return res.status(404).json({ error: 'Rendez-vous introuvable' });
    }

    const a = appt.rows[0];
    const proResult = await pool.query(
      'SELECT * FROM professionals WHERE user_id = $1', [user_id]
    );
    const isClient = a.client_id === user_id;
    const isPro = proResult.rows.length > 0 && proResult.rows[0].id === a.professional_id;

    if (!isClient && !isPro) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    await pool.query('UPDATE appointments SET status = $1 WHERE id = $2', ['cancelled', id]);
    await pool.query('UPDATE availabilities SET is_booked = FALSE WHERE id = $1', [a.availability_id]);

    const dateFormatted = formatDate(a.date);
    const timeFormatted = formatTime(a.start_time);

    // Notifier les deux parties
    await Promise.all([
      sendCancellationEmail({
        recipientName: a.client_name,
        recipientEmail: a.client_email,
        otherName: a.pro_name,
        date: dateFormatted,
        time: timeFormatted
      }),
      sendCancellationEmail({
        recipientName: a.pro_name,
        recipientEmail: a.pro_email,
        otherName: a.client_name,
        date: dateFormatted,
        time: timeFormatted
      })
    ]);

    res.json({ message: 'Rendez-vous annulé' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { createAppointment, getMyAppointments, getProAppointments, cancelAppointment };