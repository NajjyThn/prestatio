const Brevo = require('@getbrevo/brevo');
require('dotenv').config();

// ===== CONFIG BREVO PROPRE =====
const emailApi = new Brevo.TransactionalEmailsApi();

emailApi.setApiKey(
  'api-key',
  process.env.BREVO_API_KEY
);

// ===============================
// EMAIL CLIENT - CONFIRMATION RDV
// ===============================
const sendConfirmationToClient = async ({
  clientName,
  clientEmail,
  proName,
  date,
  time,
  address
}) => {
  try {
    await emailApi.sendTransacEmail({
      sender: {
        name: process.env.BREVO_SENDER_NAME,
        email: process.env.BREVO_SENDER_EMAIL
      },
      to: [{ email: clientEmail, name: clientName }],
      subject: `Votre rendez-vous avec ${proName} est confirmé`,
      htmlContent: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f4f7fb; border-radius: 16px;">
          <div style="background: linear-gradient(135deg, #1a3c5e, #0ea5e9); padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Réservio</h1>
          </div>

          <div style="background: white; padding: 28px; border-radius: 12px;">
            <h2 style="color: #1a3c5e;">Rendez-vous confirmé ✅</h2>

            <p style="color: #64748b;">
              Bonjour <strong>${clientName}</strong>, votre rendez-vous est bien enregistré.
            </p>

            <p><strong>Professionnel :</strong> ${proName}</p>
            <p><strong>Date :</strong> ${date}</p>
            <p><strong>Heure :</strong> ${time}</p>
            <p><strong>Lieu :</strong> ${address}</p>
          </div>
        </div>
      `
    });

    console.log(`Email client envoyé à ${clientEmail}`);
  } catch (err) {
    console.error('Erreur email client :', err.message);
  }
};

// ===============================
// EMAIL PRO - NOTIFICATION RDV
// ===============================
const sendNotificationToPro = async ({
  proName,
  proEmail,
  clientName,
  date,
  time,
  reason
}) => {
  try {
    await emailApi.sendTransacEmail({
      sender: {
        name: process.env.BREVO_SENDER_NAME,
        email: process.env.BREVO_SENDER_EMAIL
      },
      to: [{ email: proEmail, name: proName }],
      subject: `Nouveau rendez-vous avec ${clientName}`,
      htmlContent: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #1a3c5e;">Nouveau rendez-vous 📅</h2>

          <p>Client : <strong>${clientName}</strong></p>
          <p>Date : <strong>${date}</strong></p>
          <p>Heure : <strong>${time}</strong></p>
          ${reason ? `<p>Motif : <strong>${reason}</strong></p>` : ''}
        </div>
      `
    });

    console.log(`Email pro envoyé à ${proEmail}`);
  } catch (err) {
    console.error('Erreur email pro :', err.message);
  }
};

// ===============================
// EMAIL ANNULATION
// ===============================
const sendCancellationEmail = async ({
  recipientName,
  recipientEmail,
  otherName,
  date,
  time
}) => {
  try {
    await emailApi.sendTransacEmail({
      sender: {
        name: process.env.BREVO_SENDER_NAME,
        email: process.env.BREVO_SENDER_EMAIL
      },
      to: [{ email: recipientEmail, name: recipientName }],
      subject: `Rendez-vous annulé`,
      htmlContent: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
          <h2>Rendez-vous annulé</h2>

          <p>Bonjour <strong>${recipientName}</strong></p>

          <p>
            Votre rendez-vous avec <strong>${otherName}</strong>
            prévu le <strong>${date} à ${time}</strong> a été annulé.
          </p>

          <a href="http://localhost:3000"
             style="display:inline-block;margin-top:20px;padding:12px 24px;background:#0ea5e9;color:white;text-decoration:none;border-radius:8px;">
            Reprendre un rendez-vous
          </a>
        </div>
      `
    });

    console.log(`Email annulation envoyé à ${recipientEmail}`);
  } catch (err) {
    console.error('Erreur email annulation :', err.message);
  }
};

// ===============================
// EXPORTS
// ===============================
module.exports = {
  sendConfirmationToClient,
  sendNotificationToPro,
  sendCancellationEmail
};