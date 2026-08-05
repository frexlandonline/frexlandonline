import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

// Parse .env manually to avoid dependency issues during standalone execution
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ No se encontró el archivo .env en la raíz del proyecto.');
    process.exit(1);
  }

  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const matched = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (matched) {
      const key = matched[1];
      let val = matched[2] || '';
      // Remove surrounding quotes if present
      if (val.length > 0 && val.charAt(0) === '"' && val.charAt(val.length - 1) === '"') {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    }
  });
}

async function testEmail() {
  loadEnv();

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.error('❌ Error: Las credenciales SMTP están vacías en el archivo .env.');
    console.log('\nPor favor, edita tu archivo .env y configura las siguientes variables:');
    console.log('  SMTP_HOST=tu-servidor-smtp');
    console.log('  SMTP_PORT=587');
    console.log('  SMTP_USER=tu-usuario-o-email');
    console.log('  SMTP_PASS=tu-contraseña-o-token');
    process.exit(1);
  }

  console.log('📧 Iniciando prueba de envío con la siguiente configuración:');
  console.log(`- SMTP Host: ${host}`);
  console.log(`- SMTP Port: ${port}`);
  console.log(`- SMTP User: ${user}`);
  console.log(`- SMTP Pass: ******** (longitud: ${pass.length})`);

  const transporter = nodemailer.createTransport({
    host: host,
    port: port,
    secure: false, // true for 465, false for other ports
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false // Avoid self-signed cert issues during tests
    }
  });

  const testEmailAddress = process.argv[2] || user;
  if (!testEmailAddress) {
    console.error('❌ Error: Indica el email destinatario como argumento. Ejemplo: node test-email.js destinatario@email.com');
    process.exit(1);
  }

  console.log(`\n⏳ Enviando correo de prueba a: ${testEmailAddress}...`);

  try {
    const info = await transporter.sendMail({
      from: `"BlockDrop Test" <${user}>`,
      to: testEmailAddress,
      subject: '🧪 Prueba de Correo - BlockDrop',
      text: '¡Felicidades! Si estás leyendo esto, tu configuración SMTP en el archivo .env funciona correctamente en BlockDrop.',
      html: `
        <div style="font-family: sans-serif; padding: 20px; background: #0a0a1a; color: #e0e0e0; border-radius: 8px; max-width: 500px; margin: 0 auto; border: 1px solid #00f5ff;">
          <h2 style="color: #00f5ff; text-align: center;">⬢ BlockDrop SMTP Test</h2>
          <p>¡Hola!</p>
          <p>Este es un correo de prueba enviado desde tu servidor de <strong>BlockDrop</strong>.</p>
          <p>La configuración de tu archivo <code>.env</code> está funcionando <strong>correctamente</strong>.</p>
          <div style="background: rgba(0, 245, 255, 0.1); border: 1px solid rgba(0, 245, 255, 0.3); padding: 10px; border-radius: 4px; font-size: 0.9em; margin: 15px 0;">
            <strong>Servidor:</strong> ${host}<br>
            <strong>Usuario:</strong> ${user}<br>
            <strong>Puerto:</strong> ${port}
          </div>
          <p style="font-size: 0.8em; color: #888; text-align: center;">BlockDrop © 2024</p>
        </div>
      `
    });

    console.log('\n✅ ¡Correo enviado exitosamente!');
    console.log(`ID del mensaje: ${info.messageId}`);
  } catch (error) {
    console.error('\n❌ ERROR al enviar el correo:', error.message);
    if (error.code === 'EAUTH') {
      console.log('\n💡 Consejo: Error de autenticación. Verifica que tu usuario y contraseña sean correctos.');
      console.log('Si usas Gmail, asegúrate de activar una "Contraseña de Aplicación" en la configuración de seguridad de Google.');
    }
  }
}

testEmail();
