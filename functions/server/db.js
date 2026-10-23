import admin from 'firebase-admin';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');

// ─── Setup Firestore (If environment variables exist) ──────────────
let firestoreDb = null;
let useFirestore = false;

const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || process.env.FB_PROJECT_ID;
const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.FB_CLIENT_EMAIL;
const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY || process.env.FB_PRIVATE_KEY;

if (getApps().length === 0) {
  if (process.env.FUNCTIONS_EMULATOR || process.env.K_SERVICE || process.env.FIREBASE_CONFIG) {
    try {
      initializeApp();
      firestoreDb = getFirestore();
      useFirestore = true;
      console.log('🔥 Initialized Firebase Firestore using default application credentials.');
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin SDK automatically:', error);
      console.log('ℹ️ Falling back to SQLite local database.');
    }
  } else if (firebaseProjectId && firebaseClientEmail && firebasePrivateKey) {
    try {
      const privateKey = firebasePrivateKey.replace(/\\n/g, '\n');
      initializeApp({
        credential: cert({
          projectId: firebaseProjectId,
          clientEmail: firebaseClientEmail,
          privateKey: privateKey,
        })
      });
      firestoreDb = getFirestore();
      useFirestore = true;
      console.log('🔥 Initialized Firebase Firestore database integration successfully.');
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin SDK manually:', error);
      console.log('ℹ️ Falling back to SQLite local database.');
    }
  } else {
    console.log('ℹ️ Firebase credentials not configured. Running database on local SQLite fallback.');
  }
} else {
  firestoreDb = getFirestore();
  useFirestore = true;
}

// ─── Setup SQLite (Only initialized as fallback if Firestore is not used) ─────────
let sqliteDb = null;
if (!useFirestore) {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    sqliteDb = new Database(path.join(dataDir, 'blockdrop.db'));
    sqliteDb.pragma('journal_mode = WAL');

    // Create tables for SQLite fallback
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password_hash TEXT,
        username TEXT NOT NULL,
        google_id TEXT UNIQUE,
        email_verified INTEGER DEFAULT 0,
        avatar_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users_wallets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        address TEXT UNIQUE NOT NULL,
        chain TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS verification_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        used INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS high_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        score INTEGER NOT NULL,
        level INTEGER DEFAULT 1,
        lines_cleared INTEGER DEFAULT 0,
        platform TEXT DEFAULT 'html5',
        game_id TEXT DEFAULT 'blockdrop',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS global_high_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        game_id TEXT DEFAULT 'blockdrop',
        score INTEGER NOT NULL,
        level INTEGER DEFAULT 1,
        lines_cleared INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, game_id)
      );

      CREATE TABLE IF NOT EXISTS system_config (
        key TEXT PRIMARY KEY,
        value TEXT
      );

      CREATE TABLE IF NOT EXISTS contact_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'unread'
      );

      CREATE TABLE IF NOT EXISTS admin_withdrawals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_google ON users(google_id);
      CREATE INDEX IF NOT EXISTS idx_wallets_address ON users_wallets(address);
      CREATE INDEX IF NOT EXISTS idx_scores_score ON high_scores(score DESC);
      CREATE INDEX IF NOT EXISTS idx_verification_email ON verification_codes(email);

      INSERT OR IGNORE INTO system_config (key, value) VALUES ('admin_withdrawn_profit', '0');
    `);

    // Dynamic column addition to SQLite for user profile details
    try { sqliteDb.exec("ALTER TABLE users ADD COLUMN google_avatar_url TEXT;"); } catch(e) {}
    try { sqliteDb.exec("ALTER TABLE users ADD COLUMN twitter TEXT;"); } catch(e) {}
    try { sqliteDb.exec("ALTER TABLE users ADD COLUMN discord TEXT;"); } catch(e) {}
    try { sqliteDb.prepare('ALTER TABLE users ADD COLUMN telegram TEXT').run(); } catch (e) { /* ignore */ }
    try { sqliteDb.prepare('ALTER TABLE high_scores ADD COLUMN platform TEXT DEFAULT \'html5\'').run(); } catch (e) { /* ignore */ }
    try { sqliteDb.exec("ALTER TABLE high_scores ADD COLUMN game_id TEXT DEFAULT 'blockdrop';"); } catch(e) {}
    try { sqliteDb.exec("ALTER TABLE users ADD COLUMN creditos_escritura INTEGER DEFAULT 0;"); } catch(e) {}
    try { sqliteDb.exec("ALTER TABLE users ADD COLUMN total_depositado REAL DEFAULT 0;"); } catch(e) {}
    try { sqliteDb.exec("ALTER TABLE users ADD COLUMN high_score INTEGER DEFAULT 0;"); } catch(e) {}
    try { sqliteDb.exec("ALTER TABLE users ADD COLUMN last_credit_reset TEXT;"); } catch(e) {}
    try { sqliteDb.exec("ALTER TABLE users ADD COLUMN pending_prize_amount REAL DEFAULT 0;"); } catch(e) {}
    try { sqliteDb.exec("ALTER TABLE users ADD COLUMN pending_prize_rank TEXT DEFAULT '0';"); } catch(e) {}
    try { sqliteDb.exec("ALTER TABLE users ADD COLUMN withdraw_request_time TEXT;"); } catch(e) {}
    try { sqliteDb.exec("ALTER TABLE users ADD COLUMN withdraw_request_amount REAL DEFAULT 0;"); } catch(e) {}
    try { sqliteDb.exec("ALTER TABLE users ADD COLUMN is_world_id_verified INTEGER DEFAULT 0;"); } catch(e) {}
    try { sqliteDb.exec("ALTER TABLE users ADD COLUMN world_id_nullifier_hash TEXT;"); } catch(e) {}
    try { sqliteDb.exec("ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0;"); } catch(e) {}
    try { sqliteDb.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';"); } catch(e) {}
    try { sqliteDb.exec("ALTER TABLE users ADD COLUMN platform TEXT;"); } catch(e) {}
    try { sqliteDb.exec("ALTER TABLE users ADD COLUMN referral_code TEXT;"); } catch(e) {}
    try { sqliteDb.exec("ALTER TABLE users ADD COLUMN referred_by TEXT;"); } catch(e) {}
    try { sqliteDb.exec("ALTER TABLE users ADD COLUMN referral_earnings REAL DEFAULT 0;"); } catch(e) {}
  } catch (err) {
    console.warn('⚠️ SQLite initialization skipped or failed:', err.message);
  }
}

/**
 * Calcula los créditos semanales correspondientes al depósito acumulado:
 * - < 1 USDC (Sin Rango): 0 créditos
 * - >= 1 y < 10 USDC (Madera): 1 crédito semanal
 * - >= 10 USDC (Bronce+): 1 crédito por cada 10 USDC (sin crédito adicional por Madera)
 */
export function calculateDepositCredits(depositAmount = 0) {
  const d = Number(depositAmount) || 0;
  if (d < 1) return 0;
  if (d < 10) return 1;
  return Math.floor((d + 0.000001) / 10);
}

// Helper to format timestamps to ISO string safely
function toIsoString(val) {
  if (!val) return null;
  try {
    if (typeof val.toDate === 'function') {
      return val.toDate().toISOString();
    }
    if (val instanceof Date) {
      return !isNaN(val.getTime()) ? val.toISOString() : new Date().toISOString();
    }
    if (typeof val === 'object') {
      if (val._seconds !== undefined) {
        return new Date(val._seconds * 1000).toISOString();
      }
      return new Date().toISOString();
    }
    const d = new Date(val);
    return !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();
  } catch (error) {
    return new Date().toISOString();
  }
}

// Helper to sanitize SQLite user objects to match Firestore shape
function formatSqliteUser(user) {
  if (!user) return null;
  
  const wallets = sqliteDb.prepare('SELECT address, chain FROM users_wallets WHERE user_id = ?').all(user.id);
  const walletsMap = {};
  const walletAddresses = [];
  
  wallets.forEach(w => {
    walletsMap[w.chain] = w.address;
    walletAddresses.push(w.address.toLowerCase());
  });

  return {
    id: String(user.id),
    email: user.email,
    username: user.username,
    passwordHash: user.password_hash,
    googleId: user.google_id,
    emailVerified: Boolean(user.email_verified),
    avatarUrl: user.avatar_url,
    twitter: user.twitter || '',
    discord: user.discord || '',
    telegram: user.telegram || '',
    googleAvatarUrl: user.google_avatar_url || null,
    wallets: walletsMap,
    walletAddresses: walletAddresses,
    creditos_escritura: user.creditos_escritura || 0,
    total_depositado: Number(user.total_depositado) || 0,
    high_score: user.high_score || 0,
    last_credit_reset: user.last_credit_reset || null,
    pending_prize_amount: Number(user.pending_prize_amount) || 0,
    pending_prize_rank: user.pending_prize_rank || 0,
    withdraw_request_time: user.withdraw_request_time || null,
    withdraw_request_amount: Number(user.withdraw_request_amount) || 0,
    isWorldIdVerified: Boolean(user.is_world_id_verified || user.isWorldIdVerified),
    worldId_nullifier_hash: user.world_id_nullifier_hash || null,
    isAdmin: Boolean(user.is_admin || user.isAdmin),
    role: user.role || 'user',
    platform: user.platform || null,
    referral_code: user.referral_code || null,
    referred_by: user.referred_by || null,
    referral_earnings: Number(user.referral_earnings) || 0,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  };
}

function getCompetitionDocPath(gameId = 'blockdrop') {
  const cleanGame = (gameId || 'blockdrop').toLowerCase().trim();
  return cleanGame === 'blockdrop' ? 'leaderboard_torneo/estado_actual' : `leaderboard_torneo/${cleanGame}`;
}

// ─── Database Interface API ───────────────────────────────────────
export const dbAPI = {
  // Obtener todos los usuarios (para simulaciones y stats)
  async getAllUsers() {
    if (useFirestore) {
      const snapshot = await firestoreDb.collection('users').get();
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, ...data, createdAt: toIsoString(data.createdAt), updatedAt: toIsoString(data.updatedAt) };
      });
    } else {
      const users = sqliteDb.prepare('SELECT * FROM users').all();
      return users.map(u => formatSqliteUser(u));
    }
  },

  // Obtener suma total depositada por todos los usuarios
  async getTotalDepositedAllUsers() {
    if (useFirestore) {
      const snapshot = await firestoreDb.collection('users').get();
      let total = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        total += (Number(data.total_depositado) || 0);
      });
      return total;
    } else {
      const result = sqliteDb.prepare('SELECT SUM(total_depositado) as total FROM users').get();
      return Number(result?.total) || 0;
    }
  },

  // Verificación pasiva de créditos semanales (renovación tras cada entrega de premios con la cuenta regresiva)
  async checkAndResetDailyCredits(userId) {
    return await this.checkAndResetWeeklyCredits(userId);
  },

  async checkAndResetWeeklyCredits(userId) {
    const user = await this.getUserById(userId);
    if (!user) return user;
    
    const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    const currentWeekCycle = String(Math.floor(Date.now() / WEEK_MS));
    
    // Si last_credit_reset no existe o corresponde a un ciclo semanal anterior, renovamos los créditos
    if (!user.last_credit_reset || String(user.last_credit_reset) !== currentWeekCycle) {
      const depositCredits = calculateDepositCredits(user.total_depositado || 0);
      const humanBonus = (user.isWorldIdVerified === true) ? 1 : 0;
      const totalWeeklyCredits = depositCredits + humanBonus;
      return await this.updateUser(userId, {
        creditos_escritura: totalWeeklyCredits,
        last_credit_reset: currentWeekCycle
      });
    }
    
    return user;
  },

  // Get User by ID
  async getUserById(id) {
    if (!id) return null;
    if (useFirestore) {
      const doc = await firestoreDb.collection('users').doc(String(id)).get();
      if (!doc.exists) return null;
      const data = doc.data();
      return { id: doc.id, ...data, createdAt: toIsoString(data.createdAt), updatedAt: toIsoString(data.updatedAt) };
    } else {
      const user = sqliteDb.prepare('SELECT * FROM users WHERE id = ?').get(id);
      return formatSqliteUser(user);
    }
  },

  // Get User by Email
  async getUserByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.toLowerCase().trim();
    if (useFirestore) {
      const snapshot = await firestoreDb.collection('users').where('email', '==', cleanEmail).limit(1).get();
      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      const data = doc.data();
      return { id: doc.id, ...data, createdAt: toIsoString(data.createdAt), updatedAt: toIsoString(data.updatedAt) };
    } else {
      const user = sqliteDb.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(cleanEmail);
      return formatSqliteUser(user);
    }
  },

  // Get User by Google ID
  async getUserByGoogleId(googleId) {
    if (!googleId) return null;
    if (useFirestore) {
      const snapshot = await firestoreDb.collection('users').where('googleId', '==', googleId).limit(1).get();
      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      const data = doc.data();
      return { id: doc.id, ...data, createdAt: toIsoString(data.createdAt), updatedAt: toIsoString(data.updatedAt) };
    } else {
      const user = sqliteDb.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId);
      return formatSqliteUser(user);
    }
  },

  // Get User by Wallet Address
  async getUserByWalletAddress(address) {
    if (!address) return null;
    const cleanAddress = address.toLowerCase().trim();
    if (useFirestore) {
      const snapshot = await firestoreDb.collection('users')
        .where('walletAddresses', 'array-contains', cleanAddress)
        .limit(1)
        .get();
      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      const data = doc.data();
      return { id: doc.id, ...data, createdAt: toIsoString(data.createdAt), updatedAt: toIsoString(data.updatedAt) };
    } else {
      const walletRecord = sqliteDb.prepare('SELECT user_id FROM users_wallets WHERE LOWER(address) = ?').get(cleanAddress);
      if (!walletRecord) return null;
      const user = sqliteDb.prepare('SELECT * FROM users WHERE id = ?').get(walletRecord.user_id);
      return formatSqliteUser(user);
    }
  },

  // Create User
  async createUser(userData) {
    const email = userData.email ? userData.email.toLowerCase().trim() : null;
    const googleId = userData.googleId || null;
    const passwordHash = userData.passwordHash || null;
    const username = userData.username;
    const avatarUrl = userData.avatarUrl || null;
    const googleAvatarUrl = userData.googleAvatarUrl || null;
    const twitter = userData.twitter || '';
    const discord = userData.discord || '';
    const telegram = userData.telegram || '';
    const emailVerified = userData.emailVerified || false;
    const wallets = userData.wallets || {};
    const walletAddresses = Object.values(wallets).map(addr => addr.toLowerCase());
    const referredBy = userData.referred_by || null;

    const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    const currentWeekCycle = String(Math.floor(Date.now() / WEEK_MS));
    const now = new Date();

    if (useFirestore) {
      const newUser = {
        email,
        passwordHash,
        username,
        googleId,
        avatarUrl,
        googleAvatarUrl,
        twitter,
        discord,
        telegram,
        emailVerified,
        wallets,
        walletAddresses,
        creditos_escritura: 0,
        total_depositado: 0,
        high_score: 0,
        referral_code: null,
        referred_by: referredBy,
        referral_earnings: 0,
        last_credit_reset: currentWeekCycle,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };
      const docRef = await firestoreDb.collection('users').add(newUser);
      return { id: docRef.id, ...newUser, createdAt: now.toISOString(), updatedAt: now.toISOString() };
    } else {
      const result = sqliteDb.prepare(`
        INSERT INTO users (email, password_hash, username, google_id, email_verified, avatar_url, google_avatar_url, twitter, discord, telegram, referred_by, last_credit_reset)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(email, passwordHash, username, googleId, emailVerified ? 1 : 0, avatarUrl, googleAvatarUrl, twitter, discord, telegram, referredBy, currentWeekCycle);

      const userId = result.lastInsertRowid;

      Object.entries(wallets).forEach(([chain, addr]) => {
        sqliteDb.prepare(`
          INSERT INTO users_wallets (user_id, address, chain)
          VALUES (?, ?, ?)
        `).run(userId, addr, chain);
      });

      const user = sqliteDb.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      return formatSqliteUser(user);
    }
  },

  // Update User
  async updateUser(id, updates) {
    const cleanedUpdates = {};
    if (updates.username !== undefined) cleanedUpdates.username = updates.username;
    if (updates.avatarUrl !== undefined) cleanedUpdates.avatarUrl = updates.avatarUrl;
    if (updates.googleAvatarUrl !== undefined) cleanedUpdates.googleAvatarUrl = updates.googleAvatarUrl;
    if (updates.twitter !== undefined) cleanedUpdates.twitter = updates.twitter;
    if (updates.discord !== undefined) cleanedUpdates.discord = updates.discord;
    if (updates.telegram !== undefined) cleanedUpdates.telegram = updates.telegram;
    if (updates.emailVerified !== undefined) cleanedUpdates.emailVerified = updates.emailVerified;
    if (updates.creditos_escritura !== undefined) cleanedUpdates.creditos_escritura = updates.creditos_escritura;
    if (updates.total_depositado !== undefined) cleanedUpdates.total_depositado = updates.total_depositado;
    if (updates.high_score !== undefined) cleanedUpdates.high_score = updates.high_score;
    if (updates.last_credit_reset !== undefined) cleanedUpdates.last_credit_reset = updates.last_credit_reset;
    if (updates.pending_prize_amount !== undefined) cleanedUpdates.pending_prize_amount = updates.pending_prize_amount;
    if (updates.pending_prize_rank !== undefined) cleanedUpdates.pending_prize_rank = updates.pending_prize_rank;
    if (updates.withdraw_request_time !== undefined) cleanedUpdates.withdraw_request_time = updates.withdraw_request_time;
    if (updates.withdraw_request_amount !== undefined) cleanedUpdates.withdraw_request_amount = updates.withdraw_request_amount;
    if (updates.googleId !== undefined) cleanedUpdates.googleId = updates.googleId;
    if (updates.platform !== undefined) cleanedUpdates.platform = updates.platform;
    if (updates.isWorldIdVerified !== undefined) cleanedUpdates.isWorldIdVerified = updates.isWorldIdVerified;
    if (updates.worldId_nullifier_hash !== undefined) cleanedUpdates.worldId_nullifier_hash = updates.worldId_nullifier_hash;
    if (updates.isAdmin !== undefined) cleanedUpdates.isAdmin = updates.isAdmin;
    if (updates.role !== undefined) cleanedUpdates.role = updates.role;
    if (updates.referral_code !== undefined) cleanedUpdates.referral_code = updates.referral_code;
    if (updates.referred_by !== undefined) cleanedUpdates.referred_by = updates.referred_by;
    if (updates.referral_earnings !== undefined) cleanedUpdates.referral_earnings = updates.referral_earnings;
    if (updates.wallets !== undefined) {
      cleanedUpdates.wallets = updates.wallets;
      cleanedUpdates.walletAddresses = Object.values(updates.wallets).map(addr => addr.toLowerCase());
    }

    if (useFirestore) {
      cleanedUpdates.updatedAt = FieldValue.serverTimestamp();
      await firestoreDb.collection('users').doc(String(id)).update(cleanedUpdates);
      return this.getUserById(id);
    } else {
      const userId = parseInt(id);
      
      if (cleanedUpdates.username !== undefined) {
        sqliteDb.prepare('UPDATE users SET username = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(cleanedUpdates.username, userId);
      }
      if (cleanedUpdates.avatarUrl !== undefined) {
        sqliteDb.prepare('UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(cleanedUpdates.avatarUrl, userId);
      }
      if (cleanedUpdates.googleAvatarUrl !== undefined) {
        sqliteDb.prepare('UPDATE users SET google_avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(cleanedUpdates.googleAvatarUrl, userId);
      }
      if (cleanedUpdates.twitter !== undefined) {
        sqliteDb.prepare('UPDATE users SET twitter = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(cleanedUpdates.twitter, userId);
      }
      if (cleanedUpdates.discord !== undefined) {
        sqliteDb.prepare('UPDATE users SET discord = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(cleanedUpdates.discord, userId);
      }
      if (cleanedUpdates.telegram !== undefined) {
        sqliteDb.prepare('UPDATE users SET telegram = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(cleanedUpdates.telegram, userId);
      }
      if (cleanedUpdates.emailVerified !== undefined) {
        sqliteDb.prepare('UPDATE users SET email_verified = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(cleanedUpdates.emailVerified ? 1 : 0, userId);
      }
      if (cleanedUpdates.googleId !== undefined) {
        sqliteDb.prepare('UPDATE users SET google_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(cleanedUpdates.googleId, userId);
      }
      if (cleanedUpdates.last_credit_reset !== undefined) {
        sqliteDb.prepare('UPDATE users SET last_credit_reset = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(cleanedUpdates.last_credit_reset, userId);
      }
      if (cleanedUpdates.creditos_escritura !== undefined) {
        sqliteDb.prepare('UPDATE users SET creditos_escritura = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(cleanedUpdates.creditos_escritura, userId);
      }
      if (cleanedUpdates.total_depositado !== undefined) {
        sqliteDb.prepare('UPDATE users SET total_depositado = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(cleanedUpdates.total_depositado, userId);
      }
      if (cleanedUpdates.high_score !== undefined) {
        sqliteDb.prepare('UPDATE users SET high_score = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(cleanedUpdates.high_score, userId);
      }
      if (cleanedUpdates.pending_prize_amount !== undefined) {
        sqliteDb.prepare('UPDATE users SET pending_prize_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(cleanedUpdates.pending_prize_amount, userId);
      }
      if (cleanedUpdates.pending_prize_rank !== undefined) {
        sqliteDb.prepare('UPDATE users SET pending_prize_rank = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(cleanedUpdates.pending_prize_rank, userId);
      }
      if (cleanedUpdates.withdraw_request_time !== undefined) {
        sqliteDb.prepare('UPDATE users SET withdraw_request_time = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(cleanedUpdates.withdraw_request_time, userId);
      }
      if (cleanedUpdates.withdraw_request_amount !== undefined) {
        sqliteDb.prepare('UPDATE users SET withdraw_request_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(cleanedUpdates.withdraw_request_amount, userId);
      }
      if (cleanedUpdates.isWorldIdVerified !== undefined) {
        sqliteDb.prepare('UPDATE users SET is_world_id_verified = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(cleanedUpdates.isWorldIdVerified ? 1 : 0, userId);
      }
      if (cleanedUpdates.worldId_nullifier_hash !== undefined) {
        sqliteDb.prepare('UPDATE users SET world_id_nullifier_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(cleanedUpdates.worldId_nullifier_hash, userId);
      }
      if (cleanedUpdates.isAdmin !== undefined) {
        sqliteDb.prepare('UPDATE users SET is_admin = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(cleanedUpdates.isAdmin ? 1 : 0, userId);
      }
      if (cleanedUpdates.role !== undefined) {
        sqliteDb.prepare('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(cleanedUpdates.role, userId);
      }
      if (cleanedUpdates.platform !== undefined) {
        sqliteDb.prepare('UPDATE users SET platform = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(cleanedUpdates.platform, userId);
      }
      if (cleanedUpdates.referral_code !== undefined) {
        sqliteDb.prepare('UPDATE users SET referral_code = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(cleanedUpdates.referral_code, userId);
      }
      if (cleanedUpdates.referred_by !== undefined) {
        sqliteDb.prepare('UPDATE users SET referred_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(cleanedUpdates.referred_by, userId);
      }
      if (cleanedUpdates.referral_earnings !== undefined) {
        sqliteDb.prepare('UPDATE users SET referral_earnings = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(cleanedUpdates.referral_earnings, userId);
      }
      if (cleanedUpdates.wallets !== undefined) {
        sqliteDb.prepare('DELETE FROM users_wallets WHERE user_id = ?').run(userId);
        Object.entries(cleanedUpdates.wallets).forEach(([chain, addr]) => {
          sqliteDb.prepare(`
            INSERT INTO users_wallets (user_id, address, chain)
            VALUES (?, ?, ?)
          `).run(userId, addr, chain);
        });
      }
      
      const user = sqliteDb.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      return formatSqliteUser(user);
    }
  },

  // ─── Referral System & Credit Transfers ───────────────────────────

  async getUserByReferralCode(code) {
    if (!code) return null;
    const cleanCode = String(code).toUpperCase().trim();
    if (useFirestore) {
      const snapshot = await firestoreDb.collection('users').where('referral_code', '==', cleanCode).limit(1).get();
      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } else {
      const user = sqliteDb.prepare('SELECT * FROM users WHERE UPPER(referral_code) = ?').get(cleanCode);
      return formatSqliteUser(user);
    }
  },

  async generateReferralCode(userId) {
    const user = await this.getUserById(userId);
    if (!user) throw new Error('Usuario no encontrado');

    if (user.referral_code) {
      return user.referral_code;
    }

    const deposited = Number(user.total_depositado) || 0;
    if (deposited < 10) {
      throw new Error('Debes alcanzar al menos el Rango Bronce (10 USDC depositados) para generar tu código de referido.');
    }

    const basePrefix = (user.username || 'FREX').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) || 'FREX';
    let code = '';
    for (let attempt = 0; attempt < 5; attempt++) {
      const randHex = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 4);
      code = `${basePrefix}-${randHex}`;
      const existing = await this.getUserByReferralCode(code);
      if (!existing) break;
    }

    await this.updateUser(userId, { referral_code: code });
    return code;
  },

  async applyReferralCode(userId, code) {
    if (!code) throw new Error('Código de referido inválido');
    const user = await this.getUserById(userId);
    if (!user) throw new Error('Usuario no encontrado');
    if (user.referred_by) {
      throw new Error('Tu cuenta ya está vinculada a un referente.');
    }

    const referrer = await this.getUserByReferralCode(code);
    if (!referrer) {
      throw new Error('El código de referido ingresado no existe.');
    }

    if (String(referrer.id) === String(userId)) {
      throw new Error('No puedes usar tu propio código de referido.');
    }

    if (String(referrer.referred_by) === String(userId)) {
      throw new Error('Referencia circular no permitida.');
    }

    // Verificar que el referente tenga al menos rango Bronce (>= 10 USDC)
    if ((Number(referrer.total_depositado) || 0) < 10) {
      throw new Error('El propietario de este código no cuenta con el rango Bronce activo.');
    }

    const updated = await this.updateUser(userId, { referred_by: String(referrer.id) });
    return {
      user: updated,
      referrer: { id: String(referrer.id), username: referrer.username }
    };
  },

  async getReferralStats(userId) {
    const user = await this.getUserById(userId);
    if (!user) throw new Error('Usuario no encontrado');

    const allUsers = await this.getAllUsers();
    const directReferrals = allUsers
      .filter(u => String(u.referred_by) === String(userId))
      .map(u => ({
        id: String(u.id),
        username: u.username,
        avatarUrl: u.avatarUrl || null,
        total_depositado: Number(u.total_depositado) || 0,
        creditos_escritura: Number(u.creditos_escritura) || 0
      }));

    const directIds = new Set(directReferrals.map(r => r.id));
    const indirectReferrals = allUsers.filter(u => u.referred_by && directIds.has(String(u.referred_by)));

    let referrerInfo = null;
    if (user.referred_by) {
      const refUser = allUsers.find(u => String(u.id) === String(user.referred_by));
      if (refUser) {
        referrerInfo = { id: String(refUser.id), username: refUser.username };
      }
    }

    return {
      referralCode: user.referral_code || null,
      referredBy: referrerInfo,
      referralEarnings: Number(user.referral_earnings) || 0,
      directReferrals,
      indirectReferralsCount: indirectReferrals.length
    };
  },

  async transferCreditsToReferral(senderId, recipientId, amount) {
    const qty = Math.floor(Number(amount));
    if (isNaN(qty) || qty < 1) {
      throw new Error('La cantidad de créditos a transferir debe ser al menos 1.');
    }

    const sender = await this.getUserById(senderId);
    if (!sender) throw new Error('Usuario emisor no encontrado');

    if ((Number(sender.total_depositado) || 0) < 100) {
      throw new Error('Debes tener Rango Oro o superior (≥ 100 USDC depositados) para transferir créditos a tus referidos.');
    }

    if ((Number(sender.creditos_escritura) || 0) < qty) {
      throw new Error(`No tienes suficientes créditos disponibles (Tienes ${sender.creditos_escritura || 0}).`);
    }

    const recipient = await this.getUserById(recipientId);
    if (!recipient) throw new Error('El usuario referido no existe.');

    if (String(recipient.referred_by) !== String(senderId)) {
      throw new Error('Solo puedes transferir créditos a tus referidos directos.');
    }

    const updatedSender = await this.updateUser(senderId, {
      creditos_escritura: (Number(sender.creditos_escritura) || 0) - qty
    });

    const updatedRecipient = await this.updateUser(recipientId, {
      creditos_escritura: (Number(recipient.creditos_escritura) || 0) + qty
    });

    return {
      sender: updatedSender,
      recipient: {
        id: String(updatedRecipient.id),
        username: updatedRecipient.username,
        creditos_escritura: updatedRecipient.creditos_escritura
      },
      transferred: qty
    };
  },

  // Save Email Verification Code
  async saveVerificationCode(email, code, expiresAt) {
    const cleanEmail = email.toLowerCase().trim();
    if (useFirestore) {
      await firestoreDb.collection('verification_codes').add({
        email: cleanEmail,
        code,
        expiresAt: expiresAt,
        used: false,
        createdAt: FieldValue.serverTimestamp()
      });
    } else {
      sqliteDb.prepare(`
        INSERT INTO verification_codes (email, code, expires_at)
        VALUES (?, ?, ?)
      `).run(cleanEmail, code, expiresAt);
    }
  },

  // Get verification code record
  async getVerificationCode(email, code) {
    const cleanEmail = email.toLowerCase().trim();
    if (useFirestore) {
      const snapshot = await firestoreDb.collection('verification_codes')
        .where('email', '==', cleanEmail)
        .where('code', '==', code)
        .where('used', '==', false)
        .get();

      if (snapshot.empty) return null;

      const docs = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          createdAtTime: d.createdAt && d.createdAt.toDate ? d.createdAt.toDate().getTime() : 0
        };
      });

      docs.sort((a, b) => b.createdAtTime - a.createdAtTime);
      const latestCode = docs[0];

      const expiresAtDate = new Date(latestCode.expiresAt);
      if (expiresAtDate < new Date()) return null;

      return latestCode;
    } else {
      const record = sqliteDb.prepare(`
        SELECT * FROM verification_codes 
        WHERE LOWER(email) = ? AND code = ? AND used = 0
        ORDER BY created_at DESC LIMIT 1
      `).get(cleanEmail, code);

      if (!record) return null;

      const expiresAtDate = new Date(record.expires_at);
      if (expiresAtDate < new Date()) return null;

      return record;
    }
  },

  // Mark verification code as used
  async markVerificationCodeUsed(id) {
    if (useFirestore) {
      await firestoreDb.collection('verification_codes').doc(id).update({ used: true });
    } else {
      sqliteDb.prepare('UPDATE verification_codes SET used = 1 WHERE id = ?').run(id);
    }
  },

  // ─── Global Informative Leaderboard (Sin gasto de créditos, todos los usuarios) ───

  async saveGlobalHighScore(userId, score, level = 1, linesCleared = 0, gameId = 'blockdrop') {
    const cleanGame = (gameId || 'blockdrop').toLowerCase().trim();
    const numericScore = Number(score) || 0;
    if (numericScore <= 0) return { updated: false };

    const user = await this.getUserById(userId);
    if (!user) return { updated: false };

    if (useFirestore) {
      const userRef = firestoreDb.collection('users').doc(String(userId));
      const globalRef = firestoreDb.doc(`leaderboard_global/${cleanGame}`);

      return await firestoreDb.runTransaction(async (transaction) => {
        const [userDoc, globalDoc] = await Promise.all([
          transaction.get(userRef),
          transaction.get(globalRef)
        ]);
        if (!userDoc.exists) return { updated: false };
        const userData = userDoc.data();

        // Actualizar high_score general del usuario si corresponde a blockdrop o supera el actual
        if (numericScore > (userData.high_score || 0)) {
          transaction.update(userRef, {
            high_score: numericScore,
            updatedAt: FieldValue.serverTimestamp()
          });
        }

        let entries = globalDoc.exists ? (globalDoc.data().entries || []) : [];
        const existingIdx = entries.findIndex(e => String(e.userId) === String(userId));

        if (existingIdx !== -1) {
          if (numericScore > (entries[existingIdx].score || 0)) {
            entries[existingIdx] = {
              ...entries[existingIdx],
              username: userData.username || 'Player',
              avatarUrl: userData.avatarUrl || null,
              score: numericScore,
              level: level || 1,
              linesCleared: linesCleared || 0,
              total_depositado: Number(userData.total_depositado) || 0,
              updatedAt: Timestamp.now()
            };
          } else {
            // Siempre refrescar el depósito/rango actual y nombre
            entries[existingIdx].total_depositado = Number(userData.total_depositado) || 0;
            entries[existingIdx].username = userData.username || entries[existingIdx].username;
            entries[existingIdx].avatarUrl = userData.avatarUrl || entries[existingIdx].avatarUrl;
            transaction.set(globalRef, { entries }, { merge: true });
            return { updated: false, score: entries[existingIdx].score };
          }
        } else {
          entries.push({
            userId: String(userId),
            username: userData.username || 'Player',
            avatarUrl: userData.avatarUrl || null,
            score: numericScore,
            level: level || 1,
            linesCleared: linesCleared || 0,
            total_depositado: Number(userData.total_depositado) || 0,
            updatedAt: Timestamp.now()
          });
        }

        entries.sort((a, b) => b.score - a.score);
        entries = entries.slice(0, 200);
        transaction.set(globalRef, { entries }, { merge: true });
        return { updated: true, score: numericScore };
      });
    } else {
      const userIdInt = parseInt(userId);
      const currentHigh = Number(user.high_score) || 0;
      if (numericScore > currentHigh) {
        sqliteDb.prepare('UPDATE users SET high_score = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(numericScore, userIdInt);
      }

      const existing = sqliteDb.prepare('SELECT score FROM global_high_scores WHERE user_id = ? AND game_id = ?').get(userIdInt, cleanGame);
      if (!existing) {
        sqliteDb.prepare(`
          INSERT INTO global_high_scores (user_id, game_id, score, level, lines_cleared)
          VALUES (?, ?, ?, ?, ?)
        `).run(userIdInt, cleanGame, numericScore, level || 1, linesCleared || 0);
        return { updated: true, score: numericScore };
      } else if (numericScore > existing.score) {
        sqliteDb.prepare(`
          UPDATE global_high_scores SET score = ?, level = ?, lines_cleared = ?, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ? AND game_id = ?
        `).run(numericScore, level || 1, linesCleared || 0, userIdInt, cleanGame);
        return { updated: true, score: numericScore };
      }
      return { updated: false, score: existing.score };
    }
  },

  async getGlobalLeaderboard(gameId = 'blockdrop', limit = 100) {
    const cleanGame = (gameId || 'blockdrop').toLowerCase().trim();
    if (useFirestore) {
      const compDocPath = getCompetitionDocPath(cleanGame);
      const [globalDoc, compDoc, usersSnapshot] = await Promise.all([
        firestoreDb.doc(`leaderboard_global/${cleanGame}`).get(),
        firestoreDb.doc(compDocPath).get(),
        firestoreDb.collection('users').get()
      ]);

      const usersMap = new Map();
      usersSnapshot.docs.forEach(doc => {
        usersMap.set(doc.id, { id: doc.id, ...doc.data() });
      });

      const mergedByUser = new Map();
      if (globalDoc.exists) {
        const entries = globalDoc.data().entries || [];
        entries.forEach(e => {
          const uid = String(e.userId);
          const liveUser = usersMap.get(uid);
          if (e.score > 0) {
            mergedByUser.set(uid, {
              userId: uid,
              username: liveUser?.username || e.username || 'Player',
              avatarUrl: liveUser?.avatarUrl || e.avatarUrl || null,
              platform: liveUser?.platform || e.platform || 'html5',
              score: Number(e.score) || 0,
              total_depositado: liveUser ? (Number(liveUser.total_depositado) || 0) : (Number(e.total_depositado) || 0)
            });
          }
        });
      }

      // Incluir puntajes registrados en la tabla de competencia actual de este juego
      if (compDoc.exists) {
        const compEntries = compDoc.data().top10 || [];
        compEntries.forEach(e => {
          const uid = String(e.userId);
          const liveUser = usersMap.get(uid);
          const sc = Number(e.score) || 0;
          if (sc > 0) {
            const current = mergedByUser.get(uid);
            if (!current || sc > current.score) {
              mergedByUser.set(uid, {
                userId: uid,
                username: liveUser?.username || e.username || 'Player',
                avatarUrl: liveUser?.avatarUrl || e.avatarUrl || null,
                platform: e.platform || liveUser?.platform || 'html5',
                score: sc,
                total_depositado: liveUser ? (Number(liveUser.total_depositado) || 0) : (Number(e.total_depositado) || 0)
              });
            }
          }
        });
      }

      // Para blockdrop, incluir también cualquier usuario con high_score histórico > 0
      if (cleanGame === 'blockdrop') {
        usersMap.forEach((u, uid) => {
          const hs = Number(u.high_score) || 0;
          if (hs > 0) {
            const current = mergedByUser.get(uid);
            if (!current || hs > current.score) {
              mergedByUser.set(uid, {
                userId: uid,
                username: u.username || 'Player',
                avatarUrl: u.avatarUrl || null,
                platform: u.platform || 'html5',
                score: hs,
                total_depositado: Number(u.total_depositado) || 0
              });
            }
          }
        });
      }

      const sorted = Array.from(mergedByUser.values()).sort((a, b) => b.score - a.score);
      return sorted.slice(0, limit).map((item, idx) => ({
        ...item,
        rank: idx + 1
      }));
    } else {
      const users = sqliteDb.prepare('SELECT id, username, avatar_url, total_depositado, high_score FROM users').all();
      const gScores = sqliteDb.prepare('SELECT user_id, score FROM global_high_scores WHERE game_id = ?').all(cleanGame);
      const scoreMap = new Map();
      gScores.forEach(g => scoreMap.set(Number(g.user_id), Number(g.score)));

      const list = [];
      users.forEach(u => {
        const s1 = scoreMap.get(Number(u.id)) || 0;
        const s2 = cleanGame === 'blockdrop' ? (Number(u.high_score) || 0) : 0;
        const best = Math.max(s1, s2);
        if (best > 0) {
          list.push({
            userId: String(u.id),
            username: u.username,
            avatarUrl: u.avatar_url || null,
            score: best,
            total_depositado: Number(u.total_depositado) || 0
          });
        }
      });

      list.sort((a, b) => b.score - a.score);
      return list.slice(0, limit).map((item, idx) => ({
        ...item,
        rank: idx + 1
      }));
    }
  },

  // ─── Competition Leaderboard (Con créditos, premios y escalado dinámico de +10 puestos vacíos) ───

  async saveHighScore(userId, score, level, linesCleared, platform = 'html5', walletAddress = null, gameId = 'blockdrop', requestedMaxSlots = 3) {
    await this.checkAndResetDailyCredits(userId);
    const cleanGame = (gameId || 'blockdrop').toLowerCase().trim();
    const docPath = getCompetitionDocPath(cleanGame);

    if (useFirestore) {
      const userRef = firestoreDb.collection('users').doc(String(userId));
      const rankingRef = firestoreDb.doc(docPath);
      
      const result = await firestoreDb.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) throw new Error("User not found");
        const userData = userDoc.data();
        const creditos = userData.creditos_escritura || 0;

        if (creditos <= 0) {
          throw new Error("No tienes créditos suficientes para registrar este récord.");
        }

        const doc = await transaction.get(rankingRef);
        const docData = doc.exists ? doc.data() : {};
        let topList = docData.top10 || [];
        const currentUnlockedSlots = Math.max(3, Number(docData.unlockedSlots) || 3, Number(requestedMaxSlots) || 3);
        const submissionsCount = (Number(docData.submissionsCount) || 0) + 1;
        
        const minScoreParaEntrar = topList.length >= currentUnlockedSlots ? topList[currentUnlockedSlots - 1].score : 0;

        // Actualizar récord personal si es mayor
        const currentHighScore = userData.high_score || 0;
        const updates = {
          creditos_escritura: creditos - 1,
          updatedAt: FieldValue.serverTimestamp()
        };
        if (score > currentHighScore) {
          updates.high_score = score;
        }

        // Descontar crédito atómicamente y actualizar high_score
        transaction.update(userRef, updates);

        // Si no entra a los puestos habilitados actuales, consumimos crédito pero sí sumamos la grabación al juego
        if (score <= minScoreParaEntrar && topList.length >= currentUnlockedSlots) {
          transaction.set(rankingRef, { submissionsCount, unlockedSlots: currentUnlockedSlots }, { merge: true });
          return { id: null, userId, score, level, linesCleared, rank: 'fuera_del_top', unlockedSlots: currentUnlockedSlots };
        }

        topList.push({
          userId: String(userId),
          username: userData.username || 'Unknown',
          avatarUrl: userData.avatarUrl || null,
          walletAddress,
          platform,
          gameId: cleanGame,
          score,
          level,
          linesCleared,
          total_depositado: Number(userData.total_depositado) || 0,
          createdAt: Timestamp.now()
        });

        // Ordenar descendente y mantener solo hasta la cantidad de puestos habilitados actuales (dejando vacíos los futuros cuando se abran)
        topList.sort((a, b) => b.score - a.score);
        topList = topList.slice(0, currentUnlockedSlots);

        transaction.set(rankingRef, {
          top10: topList,
          submissionsCount,
          unlockedSlots: currentUnlockedSlots
        }, { merge: true });

        const myIndex = topList.findIndex(e => e.score === score && e.userId === String(userId));
        return { id: 'top_doc', userId, score, level, linesCleared, rank: myIndex + 1, unlockedSlots: currentUnlockedSlots };
      });

      // También actualizar la tabla global informativa sin costo
      await this.saveGlobalHighScore(userId, score, level, linesCleared, cleanGame).catch(() => {});
      return result;
    } else {
      const userIdInt = parseInt(userId);
      const user = sqliteDb.prepare('SELECT creditos_escritura, high_score FROM users WHERE id = ?').get(userIdInt);
      if (!user) throw new Error("User not found");
      const creditos = user.creditos_escritura || 0;
      const currentHighScore = user.high_score || 0;

      if (creditos <= 0) {
        throw new Error("No tienes créditos suficientes para registrar este récord.");
      }

      const unlockedKey = `unlocked_slots_${cleanGame}`;
      const subCountKey = `submissions_count_${cleanGame}`;
      const savedSlots = parseInt(await this.getSystemConfig(unlockedKey) || '3');
      const currentUnlockedSlots = Math.max(3, savedSlots, Number(requestedMaxSlots) || 3);
      const currentSubCount = parseInt(await this.getSystemConfig(subCountKey) || '0') + 1;

      await this.updateSystemConfig(unlockedKey, String(currentUnlockedSlots));
      await this.updateSystemConfig(subCountKey, String(currentSubCount));

      const tx = sqliteDb.transaction(() => {
        if (score > currentHighScore) {
          sqliteDb.prepare('UPDATE users SET creditos_escritura = creditos_escritura - 1, high_score = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(score, userIdInt);
        } else {
          sqliteDb.prepare('UPDATE users SET creditos_escritura = creditos_escritura - 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(userIdInt);
        }
        
        const rankRecordLocal = sqliteDb.prepare('SELECT COUNT(*) as rank FROM high_scores WHERE game_id = ? AND score > ?').get(cleanGame, score);
        const rankAntes = (rankRecordLocal.rank || 0) + 1;

        if (rankAntes > currentUnlockedSlots) {
          return { id: null, userId, score, level, linesCleared, rank: 'fuera_del_top', unlockedSlots: currentUnlockedSlots };
        }

        const result = sqliteDb.prepare(`
          INSERT INTO high_scores (user_id, score, level, lines_cleared, platform, game_id)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(userIdInt, score, level || 1, linesCleared || 0, platform, cleanGame);

        // Mantener solo los top N puestos habilitados actuales
        sqliteDb.prepare(`
          DELETE FROM high_scores
          WHERE game_id = ? AND id NOT IN (
            SELECT id FROM high_scores WHERE game_id = ? ORDER BY score DESC LIMIT ?
          )
        `).run(cleanGame, cleanGame, currentUnlockedSlots);

        return { id: String(result.lastInsertRowid), userId, score, level, linesCleared, rank: rankAntes, unlockedSlots: currentUnlockedSlots };
      });

      const res = tx();
      await this.saveGlobalHighScore(userId, score, level, linesCleared, cleanGame).catch(() => {});
      return res;
    }
  },

  // Get Competition Leaderboard (Soporta escalado dinámico: 13, 23, 33... puestos)
  async getLeaderboard(limit = 100, gameId = 'blockdrop') {
    const cleanGame = (gameId || 'blockdrop').toLowerCase().trim();
    const docPath = getCompetitionDocPath(cleanGame);

    if (useFirestore) {
      const [doc, usersSnapshot] = await Promise.all([
        firestoreDb.doc(docPath).get(),
        firestoreDb.collection('users').get()
      ]);
      if (!doc.exists) return [];

      const usersMap = new Map();
      usersSnapshot.docs.forEach(uDoc => {
        usersMap.set(uDoc.id, uDoc.data());
      });
      
      const topList = doc.data().top10 || [];
      return topList.slice(0, limit).map((data, index) => {
        const liveUser = usersMap.get(String(data.userId));
        const liveDeposit = liveUser && liveUser.total_depositado !== undefined
          ? (Number(liveUser.total_depositado) || 0)
          : (Number(data.total_depositado) || 0);
        return {
          id: data.userId,
          userId: data.userId,
          username: liveUser?.username || data.username,
          avatarUrl: liveUser?.avatarUrl || data.avatarUrl || null,
          platform: data.platform || liveUser?.platform || 'html5',
          gameId: data.gameId || cleanGame,
          score: data.score,
          level: data.level,
          linesCleared: data.linesCleared,
          total_depositado: liveDeposit,
          createdAt: toIsoString(data.createdAt),
          rank: index + 1
        };
      });
    } else {
      const scores = sqliteDb.prepare(`
        SELECT h.id, h.user_id, h.score, h.level, h.lines_cleared, h.platform, h.game_id, h.created_at, u.username, u.avatar_url, u.total_depositado
        FROM high_scores h
        JOIN users u ON h.user_id = u.id
        WHERE h.game_id = ?
        ORDER BY h.score DESC
        LIMIT ?
      `).all(cleanGame, limit);

      return scores.map((s, i) => ({
        id: String(s.id),
        userId: String(s.user_id),
        username: s.username,
        score: s.score,
        level: s.level,
        linesCleared: s.lines_cleared,
        platform: s.platform || 'html5',
        gameId: s.game_id || cleanGame,
        createdAt: s.created_at,
        avatarUrl: s.avatar_url,
        total_depositado: Number(s.total_depositado) || 0,
        rank: i + 1
      }));
    }
  },

  // Obtener metadatos de la tabla de competencia de un juego (puestos desbloqueados y cantidad de grabaciones)
  async getCompetitionMeta(gameId = 'blockdrop') {
    const cleanGame = (gameId || 'blockdrop').toLowerCase().trim();
    const docPath = getCompetitionDocPath(cleanGame);
    if (useFirestore) {
      const doc = await firestoreDb.doc(docPath).get();
      if (!doc.exists) return { unlockedSlots: 3, submissionsCount: 0 };
      const d = doc.data();
      const listLen = (d.top10 || []).length;
      return {
        unlockedSlots: Math.max(3, Number(d.unlockedSlots) || 3),
        submissionsCount: Math.max(listLen, Number(d.submissionsCount) || 0)
      };
    } else {
      const unlockedSlots = Math.max(3, parseInt(await this.getSystemConfig(`unlocked_slots_${cleanGame}`) || '3'));
      const countRow = sqliteDb.prepare('SELECT COUNT(*) as c FROM high_scores WHERE game_id = ?').get(cleanGame);
      const savedSubCount = parseInt(await this.getSystemConfig(`submissions_count_${cleanGame}`) || '0');
      return {
        unlockedSlots,
        submissionsCount: Math.max(countRow?.c || 0, savedSubCount)
      };
    }
  },

  // Actualizar cantidad de puestos habilitados cuando el pozo supera el umbral (> 10 USDC el 3er puesto o el menor premio)
  async setUnlockedSlots(gameId = 'blockdrop', newUnlockedSlots = 3) {
    const cleanGame = (gameId || 'blockdrop').toLowerCase().trim();
    const docPath = getCompetitionDocPath(cleanGame);
    const slots = Math.max(3, Number(newUnlockedSlots) || 3);
    if (useFirestore) {
      await firestoreDb.doc(docPath).set({ unlockedSlots: slots }, { merge: true });
    } else {
      await this.updateSystemConfig(`unlocked_slots_${cleanGame}`, String(slots));
    }
    return slots;
  },

  // --- Clear all scores (Weekly reset: reinicia con los 3 primeros puestos habilitados) ---
  clearAllScores: async () => {
    if (useFirestore) {
      await firestoreDb.doc('leaderboard_torneo/estado_actual').set({ top10: [], unlockedSlots: 3, submissionsCount: 0 });
      await firestoreDb.doc('leaderboard_torneo/snake').set({ top10: [], unlockedSlots: 3, submissionsCount: 0 });
    } else {
      sqliteDb.prepare('DELETE FROM high_scores').run();
      sqliteDb.prepare("INSERT OR REPLACE INTO system_config (key, value) VALUES ('unlocked_slots_blockdrop', '3')").run();
      sqliteDb.prepare("INSERT OR REPLACE INTO system_config (key, value) VALUES ('submissions_count_blockdrop', '0')").run();
      sqliteDb.prepare("INSERT OR REPLACE INTO system_config (key, value) VALUES ('unlocked_slots_snake', '3')").run();
      sqliteDb.prepare("INSERT OR REPLACE INTO system_config (key, value) VALUES ('submissions_count_snake', '0')").run();
    }
  },

  // --- Contact Messages ---
  saveContactMessage: async (email, message) => {
    if (useFirestore) {
      try {
        await firestoreDb.collection('contact_messages').add({
          email,
          message,
          status: 'unread',
          createdAt: FieldValue.serverTimestamp()
        });
      } catch (error) {
        console.error('Firestore saveContactMessage error:', error);
      }
    }
    const stmt = sqliteDb.prepare('INSERT INTO contact_messages (email, message) VALUES (?, ?)');
    return stmt.run(email, message);
  },

  // ─── System Config ────────────────────────────────────────────────────────
  
  getSystemConfig: async (key) => {
    if (useFirestore) {
      try {
        const doc = await firestoreDb.collection('config').doc(key).get();
        if (doc.exists) {
          return doc.data().value;
        }
      } catch (e) {
        console.error('getSystemConfig firestore error:', e);
      }
      return null;
    } else {
      const result = sqliteDb.prepare('SELECT value FROM system_config WHERE key = ?').get(key);
      return result ? result.value : null;
    }
  },

  updateSystemConfig: async (key, value) => {
    if (useFirestore) {
      try {
        await firestoreDb.collection('config').doc(key).set({ value: String(value) });
        return true;
      } catch (e) {
        console.error('updateSystemConfig firestore error:', e);
        return false;
      }
    } else {
      sqliteDb.prepare('INSERT OR REPLACE INTO system_config (key, value) VALUES (?, ?)').run(key, String(value));
      return true;
    }
  },

  // ─── Admin Withdrawals History ────────────────────────────────────────────

  getAdminWithdrawals: async () => {
    if (useFirestore) {
      try {
        const snapshot = await firestoreDb.collection('admin_withdrawals').orderBy('createdAt', 'desc').get();
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt ? doc.data().createdAt.toDate().toISOString() : null
        }));
      } catch (e) {
        console.error('getAdminWithdrawals firestore error:', e);
        return [];
      }
    } else {
      return sqliteDb.prepare('SELECT id, amount, created_at as createdAt FROM admin_withdrawals ORDER BY created_at DESC').all();
    }
  },

  recordAdminWithdrawal: async (amount) => {
    if (useFirestore) {
      try {
        await firestoreDb.collection('admin_withdrawals').add({
          amount: Number(amount),
          createdAt: FieldValue.serverTimestamp()
        });
        return true;
      } catch (e) {
        console.error('recordAdminWithdrawal firestore error:', e);
        return false;
      }
    } else {
      sqliteDb.prepare('INSERT INTO admin_withdrawals (amount) VALUES (?)').run(amount);
      return true;
    }
  }
};

export default dbAPI;
