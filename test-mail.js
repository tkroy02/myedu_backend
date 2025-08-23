// test-mail.js
require('dotenv').config();
const nodemailer = require('nodemailer');

async function sendTest() {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    },
    tls: { rejectUnauthorized: false },
    logger: true,
    debug: true
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER, // send to yourself
      subject: "Tklesson Test Email",
      text: "This is a test email from Tklesson server."
    });
    console.log("Email sent:", info);
  } catch (err) {
    console.error("Error sending test email:", err);
  }
}

sendTest();
