import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbAPI from '../db.js';
import { generateToken, authenticateToken, JWT_SECRET } from '../middleware/auth.js';
import { generateVerificationCode, sendVerificationEmail } from '../services/email.js';
import crypto from 'crypto';
import { verifyMessage } from 'viem';

const router = Router();
const nonceStore = new Map();

// ─── Register with Email ─────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, contraseña y nombre de usuario son requeridos' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Check if user exists
    const existing = await dbAPI.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Este email ya está registrado' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate and send verification code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    const cleanEmail = email.toLowerCase().trim();
    await dbAPI.saveVerificationCode(cleanEmail, code, expiresAt);
    await sendVerificationEmail(cleanEmail, code);

    // Generate a temporary token signed with registration info
    const tempUserPayload = { 
      email: cleanEmail, 
      username, 
      passwordHash, 
      isPending: true 
    };
    const token = jwt.sign(tempUserPayload, JWT_SECRET, { expiresIn: '15m' });

    res.status(201).json({
      message: 'Código enviado. Revisa tu correo para el código de verificación.',
      token,
      user: { email: cleanEmail, username, emailVerified: false },
      requiresVerification: true
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── Login with Email ─────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const user = await dbAPI.getUserByEmail(email);

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (!user.passwordHash) {
      return res.status(401).json({ error: 'Esta cuenta usa otro método de inicio de sesión (Google o Billeteras)' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = generateToken(user);
    const { passwordHash, ...safeUser } = user;

    res.json({
      message: 'Login exitoso',
      token,
      user: safeUser,
      requiresVerification: !user.emailVerified
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── Verify Email Code ───────────────────────────────────────
router.post('/verify-email', authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Código de verificación requerido' });
    }

    let user = null;
    let email = null;
    let isPending = req.user.isPending || false;

    if (isPending) {
      email = req.user.email;
    } else {
      const existingUser = await dbAPI.getUserById(req.user.id);
      if (!existingUser) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      user = existingUser;
      email = existingUser.email;
    }

    const verification = await dbAPI.getVerificationCode(email, code);

    if (!verification) {
      return res.status(400).json({ error: 'Código inválido o expirado' });
    }

    // Mark code as used
    await dbAPI.markVerificationCodeUsed(verification.id);

    if (isPending) {
      // Create user in Firestore/SQLite since it is now verified!
      user = await dbAPI.createUser({
        email: req.user.email,
        passwordHash: req.user.passwordHash,
        username: req.user.username,
        emailVerified: true,
        wallets: {}
      });
    } else {
      // Mark existing user email as verified
      user = await dbAPI.updateUser(user.id, { emailVerified: true });
    }

    // Generate real session token
    const token = generateToken(user);
    const { passwordHash, ...safeUser } = user;

    res.json({ 
      message: 'Email verificado y perfil registrado exitosamente', 
      token, 
      user: safeUser 
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── Resend Verification Code ────────────────────────────────
router.post('/resend-code', authenticateToken, async (req, res) => {
  try {
    let email = null;
    let isPending = req.user.isPending || false;

    if (isPending) {
      email = req.user.email;
    } else {
      const user = await dbAPI.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      if (user.emailVerified) {
        return res.status(400).json({ error: 'El email ya está verificado' });
      }
      email = user.email;
    }

    if (!email) {
      return res.status(400).json({ error: 'Email requerido' });
    }

    // Generate new code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await dbAPI.saveVerificationCode(email, code, expiresAt);
    await sendVerificationEmail(email, code);

    res.json({ message: 'Nuevo código enviado' });
  } catch (error) {
    console.error('Resend error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── Wallet Login/Register (Metamask, Phantom, etc.) ─────────
router.get('/nonce', (req, res) => {
  const nonce = crypto.randomBytes(16).toString('hex');
  // Almacenar nonce con un tiempo de expiración (ej. 5 min)
  const expiresAt = Date.now() + 5 * 60 * 1000;
  // Como clave podemos usar el nonce mismo
  nonceStore.set(nonce, expiresAt);
  res.json({ nonce });
});

router.post('/metamask-login', async (req, res) => {
  try {
    const { walletAddress, username, chain, message, signature } = req.body;
    const selectedChain = chain || 'ethereum';

    if (!walletAddress || !message || !signature) {
      return res.status(400).json({ error: 'Dirección de wallet, mensaje y firma son requeridos' });
    }

    // Extraer y validar el nonce desde el mensaje
    // Asumimos que el mensaje termina en "Nonce: <nonce>"
    const nonceMatch = message.match(/Nonce:\s*([a-fA-F0-9]+)/);
    if (!nonceMatch) {
      return res.status(400).json({ error: 'Mensaje inválido (sin nonce)' });
    }
    const nonce = nonceMatch[1];
    
    // Verificar si el nonce existe y no expiró
    const expiresAt = nonceStore.get(nonce);
    if (!expiresAt || Date.now() > expiresAt) {
      if (expiresAt) nonceStore.delete(nonce);
      return res.status(401).json({ error: 'Nonce expirado o inválido' });
    }
    nonceStore.delete(nonce); // Usar una sola vez

    // Validar el texto requerido de autorización
    if (!message.toLowerCase().includes('autorizo a ver mi saldo en usdc en la red de base mainnet y tesnet (sepolia)')) {
      return res.status(401).json({ error: 'El mensaje no incluye la autorización requerida' });
    }

    // Verificar la firma con viem
    let isValid = false;
    try {
      isValid = await verifyMessage({
        address: walletAddress,
        message: message,
        signature: signature
      });
    } catch (err) {
      return res.status(401).json({ error: 'Firma inválida o malformada' });
    }

    if (!isValid) {
      return res.status(401).json({ error: 'La firma no corresponde a la billetera proporcionada' });
    }

    const normalizedAddress = walletAddress.toLowerCase().trim();

    // Check if user exists with this wallet address
    let user = await dbAPI.getUserByWalletAddress(normalizedAddress);

    if (!user) {
      // Create new user with wallet mapping
      const displayName = username || `Player_${normalizedAddress.slice(2, 8)}`;
      const walletsMap = {};
      walletsMap[selectedChain] = walletAddress;

      user = await dbAPI.createUser({
        username: displayName,
        emailVerified: true,
        wallets: walletsMap
      });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login con Billetera exitoso',
      token,
      user,
      isNewUser: !user.email
    });
  } catch (error) {
    console.error('Wallet login error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── Google OAuth Callback ───────────────────────────────────
router.post('/google', async (req, res) => {
  try {
    const { googleId, email, name, picture } = req.body;

    if (!googleId || !email) {
      return res.status(400).json({ error: 'Datos de Google incompletos' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user exists
    let user = await dbAPI.getUserByGoogleId(googleId);
    if (!user) {
      user = await dbAPI.getUserByEmail(cleanEmail);
    }

    if (user) {
      // Update Google info if needed
      const updates = {
        googleId,
        googleAvatarUrl: picture,
        emailVerified: true
      };
      if (!user.avatarUrl) {
        updates.avatarUrl = picture;
      }
      user = await dbAPI.updateUser(user.id, updates);
    } else {
      // Create new user
      user = await dbAPI.createUser({
        email: cleanEmail,
        username: name || cleanEmail.split('@')[0],
        googleId,
        avatarUrl: picture,
        googleAvatarUrl: picture,
        emailVerified: true,
        wallets: {}
      });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login con Google exitoso',
      token,
      user
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── Get Current User ────────────────────────────────────────
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // Check for daily credit reset instead of just getting the user
    const user = await dbAPI.checkAndResetDailyCredits(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const { passwordHash, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── Update User Profile ────────────────────────────────────
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { username, avatarUrl, twitter, discord, telegram } = req.body;
    const userId = req.user.id;

    let user = await dbAPI.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const updates = {};
    if (username !== undefined) updates.username = username;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
    if (twitter !== undefined) updates.twitter = twitter;
    if (discord !== undefined) updates.discord = discord;
    if (telegram !== undefined) updates.telegram = telegram;

    if (Object.keys(updates).length > 0) {
      user = await dbAPI.updateUser(userId, updates);
    }

    const { passwordHash, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── Get Public Configurations ────────────────────────────────
router.get('/config', (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || ''
  });
});

export default router;
