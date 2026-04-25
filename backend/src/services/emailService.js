const Brevo = require('@getbrevo/brevo');
require('dotenv').config();

const emailApi = new Brevo.TransactionalEmailsApi();

emailApi.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

// Email de confirmation RDV au client
const sendConfirmationToClient = async ({ clientName, clientEmail, proName, date, time, address }) => {
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
          <div style="background: white; padding: 28px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
            <h2 style="color: #1a3c5e; margin-bottom: 8px;">Rendez-vous confirmé ✅</h2>
            <p style="color: #64748b; margin-bottom: 24px;">Bonjour <strong>${clientName}</strong>, votre rendez-vous est bien enregistré.</p>
            <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 10px; padding: 16px; margin-bottom: 24px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #64748b; font-size: 14px;">Professionnel</span>
                <span style="font-weight: 700; color: #1a3c5e; font-size: 14px;">${proName}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #64748b; font-size: 14px;">Date</span>
                <span style="font-weight: 700; color: #1a3c5e; font-size: 14px;">${date}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #64748b; font-size: 14px;">Heure</span>
                <span style="font-weight: 700; color: #1a3c5e; font-size: 14px;">${time}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b; font-size: 14px;">Lieu</span>
                <span style="font-weight: 700; color: #1a3c5e; font-size: 14px;">${address}</span>
              </div>
            </div>
            <p style="color: #94a3b8; font-size: 13px; text-align: center;">
              Pour annuler, connectez-vous sur <a href="http://localhost:3000/dashboard" style="color: #0ea5e9;">votre espace</a>.
            </p>
          </div>
        </div>
      `
    });
    console.log(`Email confirmation envoyé à ${clientEmail}`);
  } catch (err) {
    console.error('Erreur envoi email client :', err.message);
  }
};

// Email de notification au professionnel
const sendNotificationToPro = async ({ proName, proEmail, clientName, date, time, reason }) => {
  try {
    await emailApi.sendTransacEmail({
      sender: {
        name: process.env.BREVO_SENDER_NAME,
        email: process.env.BREVO_SENDER_EMAIL
      },
      to: [{ email: proEmail, name: proName }],
      subject: `Nouveau rendez-vous avec ${clientName}`,
      htmlContent: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f4f7fb; border-radius: 16px;">
          <div style="background: linear-gradient(135deg, #1a3c5e, #0ea5e9); padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Réservio</h1>
          </div>
          <div style="background: white; padding: 28px; border-radius: 12px;">
            <h2 style="color: #1a3c5e; margin-bottom: 8px;">Nouveau rendez-vous 📅</h2>
            <p style="color: #64748b; margin-bottom: 24px;">Bonjour <strong>${proName}</strong>, vous avez un nouveau rendez-vous.</p>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px; margin-bottom: 24px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #64748b; font-size: 14px;">Client</span>
                <span style="font-weight: 700; color: #1a3c5e; font-size: 14px;">${clientName}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #64748b; font-size: 14px;">Date</span>
                <span style="font-weight: 700; color: #1a3c5e; font-size: 14px;">${date}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #64748b; font-size: 14px;">Heure</span>
                <span style="font-weight: 700; color: #1a3c5e; font-size: 14px;">${time}</span>
              </div>
              ${reason ? `
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b; font-size: 14px;">Motif</span>
                <span style="font-weight: 700; color: #1a3c5e; font-size: 14px;">${reason}</span>
              </div>` : ''}
            </div>
            <p style="color: #94a3b8; font-size: 13px; text-align: center;">
              Gérez vos RDV sur <a href="http://localhost:3000/dashboard" style="color: #0ea5e9;">votre espace professionnel</a>.
            </p>
          </div>
        </div>
      `
    });
    console.log(`Email notification envoyé à ${proEmail}`);
  } catch (err) {
    console.error('Erreur envoi email pro :', err.message);
  }
};

// Email d'annulation
const sendCancellationEmail = async ({ recipientName, recipientEmail, otherName, date, time }) => {
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
          <h2 style="color: #1a3c5e;">Rendez-vous annulé</h2>
          <p style="color: #64748b;">Bonjour <strong>${recipientName}</strong>,</p>
          <p style="color: #64748b;">Votre rendez-vous avec <strong>${otherName}</strong> prévu le <strong>${date} à ${time}</strong> a été annulé.</p>
          <a href="http://localhost:3000" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #0ea5e9; color: white; border-radius: 8px; text-decoration: none; font-weight: 700;">
            Reprendre un rendez-vous
          </a>
        </div>
      `
    });
  } catch (err) {
    console.error('Erreur envoi email annulation :', err.message);
  }
};

module.exports = {
  sendConfirmationToClient,
  sendNotificationToPro,
  sendCancellationEmail
};