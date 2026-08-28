import { Router } from 'express';
import dbAPI from '../db.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const router = Router();
const challenges = new Map();

// Periodic cleanup of expired challenges
setInterval(() => {
  const now = Date.now();
  for (const [id, challenge] of challenges.entries()) {
    if (challenge.expires < now) {
      challenges.delete(id);
    }
  }
}, 60000).unref();

router.get('/challenge', (req, res) => {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const challengeId = crypto.randomUUID();
  challenges.set(challengeId, { answer: num1 + num2, expires: Date.now() + 10 * 60000 });
  res.json({ challengeId, text: `¿Cuánto es ${num1} + ${num2}?` });
});

router.post('/', async (req, res) => {
  try {
    const { email, message, math_answer, challengeId, honeypot } = req.body;

    // 1. Honeypot check (invisible field for bots)
    if (honeypot && honeypot.length > 0) {
      return res.json({ message: 'Mensaje enviado correctamente.' });
    }

    // 2. Dynamic math challenge check
    const challenge = challenges.get(challengeId);
    if (!challenge || challenge.answer !== parseInt(math_answer) || challenge.expires < Date.now()) {
      return res.status(400).json({ error: 'La respuesta de seguridad es incorrecta o ha expirado.' });
    }
    
    // Clean up used challenge
    challenges.delete(challengeId);

    if (!email || !message) {
      return res.status(400).json({ error: 'Email y mensaje son obligatorios.' });
    }

    // 3. Save to database (as backup)
    await dbAPI.saveContactMessage(email, message);

    // 4. Send Email via Nodemailer if configured
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const mailOptions = {
        from: `"${email}" <${process.env.SMTP_USER}>`, 
        to: process.env.SMTP_USER, // destination (same as user)
        subject: `Nuevo mensaje de Contacto de: ${email}`,
        text: `Has recibido un nuevo mensaje desde el formulario de contacto de FrexLand:\n\nEmail del remitente: ${email}\n\nMensaje:\n${message}`
      };

      await transporter.sendMail(mailOptions);
    }

    res.json({ message: 'Mensaje enviado correctamente. Te contactaremos pronto.' });
  } catch (error) {
    console.error('Contact error:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

export default router;
