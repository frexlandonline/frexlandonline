import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host: host,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user, pass }
    });
    console.log('📧 Email service configured with SMTP');
  } else {
    console.log('📧 Email service in DEV mode (codes shown in console)');
    transporter = null;
  }

  return transporter;
}

export function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationEmail(email, code) {
  const transport = getTransporter();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a1a; color: #e0e0e0; padding: 40px; }
        .container { max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e, #16213e); border-radius: 16px; padding: 40px; border: 1px solid rgba(0, 245, 255, 0.2); }
        .logo { text-align: center; font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #00f5ff, #ff00e5); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 24px; }
        .code { text-align: center; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #00f5ff; background: rgba(0, 245, 255, 0.1); border: 2px solid rgba(0, 245, 255, 0.3); border-radius: 12px; padding: 16px; margin: 24px 0; }
        .text { text-align: center; color: #a0a0b0; font-size: 14px; line-height: 1.6; }
        .footer { text-align: center; margin-top: 32px; color: #606070; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">⬢ FrexLand</div>
        <p class="text">Tu código de verificación es:</p>
        <div class="code">${code}</div>
        <p class="text">Este código expira en 10 minutos.<br>Si no solicitaste este código, ignora este mensaje.</p>
        <div class="footer">FrexLand © 2024</div>
      </div>
    </body>
    </html>
  `;

  if (transport) {
    try {
      await transport.sendMail({
        from: `"FrexLand" <${process.env.SMTP_USER}>`,
        to: email,
        subject: '🔐 Tu código de verificación - FrexLand',
        html: htmlContent
      });
      console.log(`📧 Verification email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending email:', error.message);
      // Fallback to console
      console.log(`\n${'='.repeat(50)}`);
      console.log(`📧 VERIFICATION CODE for ${email}: ${code}`);
      console.log(`${'='.repeat(50)}\n`);
      return true;
    }
  } else {
    // Dev mode: print to console
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📧 VERIFICATION CODE for ${email}: ${code}`);
    console.log(`${'='.repeat(50)}\n`);
    return true;
  }
}
