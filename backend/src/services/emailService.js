const axios = require('axios');
require('dotenv').config();

const BREVO_API_KEY = process.env.BREVO_API_KEY;

// ===============================
// FONCTION GÉNÉRIQUE D'ENVOI
// ===============================
const sendEmail = async ({ toEmail, toName, subject, htmlContent }) => {
  try {
    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name: process.env.BREVO_SENDER_NAME,
          email: process.env.BREVO_SENDER_EMAIL
        },
        to: [
          {
            email: toEmail,
            name: toName
          }
        ],
        subject,
        htmlContent
      },
      {
        headers: {
          'api-key': BREVO_API_KEY,
          'content-type': 'application/json'
        }
      }
    );

    console.log(`Email envoyé à ${toEmail}`);
  } catch (err) {
    console.error('Erreur email:', err.response?.data || err.message);
  }
};

// ===============================
// EMAIL CLIENT
// ===============================
const sendConfirmationToClient = async (data) => {
  return sendEmail({
    toEmail: data.clientEmail,
    toName: data.clientName,
    subject: `Votre rendez-vous avec ${data.proName} est confirmé`,
    htmlContent: `<p>Bonjour ${data.clientName}, votre RDV est confirmé.</p>`
  });
};

// ===============================
// EMAIL PRO
// ===============================
const sendNotificationToPro = async (data) => {
  return sendEmail({
    toEmail: data.proEmail,
    toName: data.proName,
    subject: `Nouveau rendez-vous avec ${data.clientName}`,
    htmlContent: `<p>Nouveau RDV avec ${data.clientName}</p>`
  });
};

// ===============================
// EMAIL ANNULATION
// ===============================
const sendCancellationEmail = async (data) => {
  return sendEmail({
    toEmail: data.recipientEmail,
    toName: data.recipientName,
    subject: `Rendez-vous annulé`,
    htmlContent: `<p>Votre RDV a été annulé.</p>`
  });
};

module.exports = {
  sendConfirmationToClient,
  sendNotificationToPro,
  sendCancellationEmail
};