import admin from 'firebase-admin';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');

// ─── Setup SQLite (Always initialized as fallback) ─────────────────
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const sqliteDb = new Database(path.join(dataDir, 'blockdrop.db'));
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
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
try { sqliteDb.exec("ALTER TABLE users ADD COLUMN creditos_escritura INTEGER DEFAULT 0;"); } catch(e) {}
try { sqliteDb.exec("ALTER TABLE users ADD COLUMN total_depositado INTEGER DEFAULT 0;"); } catch(e) {}
try { sqliteDb.exec("ALTER TABLE users ADD COLUMN high_score INTEGER DEFAULT 0;"); } catch(e) {}
try { sqliteDb.exec("ALTER TABLE users ADD COLUMN last_credit_reset TEXT;"); } catch(e) {}
try { sqliteDb.exec("ALTER TABLE users ADD COLUMN pending_prize_amount INTEGER DEFAULT 0;"); } catch(e) {}
try { sqliteDb.exec("ALTER TABLE users ADD COLUMN pending_prize_rank INTEGER DEFAULT 0;"); } catch(e) {}
try { sqliteDb.exec("ALTER TABLE users ADD COLUMN withdraw_request_time TEXT;"); } catch(e) {}
try { sqliteDb.exec("ALTER TABLE users ADD COLUMN withdraw_request_amount INTEGER DEFAULT 0;"); } catch(e) {}


// ─── Setup Firestore (If environment variables exist) ──────────────
let firestoreDb = null;
let useFirestore = false;

const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY;

if (getApps().length === 0) {
  if (process.env.FUNCTIONS_EMULATOR || process.env.K_SERVICE) {
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
      // Check if it's a Firestore Timestamp-like object from serialized/cached state
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
  
  // Fetch linked wallets for this user in SQLite
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
    total_depositado: user.total_depositado || 0,
    high_score: user.high_score || 0,
    last_credit_reset: user.last_credit_reset || null,
    pending_prize_amount: user.pending_prize_amount || 0,
    pending_prize_rank: user.pending_prize_rank || 0,
    withdraw_request_time: user.withdraw_request_time || null,
    withdraw_request_amount: user.withdraw_request_amount || 0,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  };
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
  // Verificación pasiva de créditos diarios
  async checkAndResetDailyCredits(userId) {
    const user = await this.getUserById(userId);
    if (!user) return user;
    
    // Obtenemos la fecha UTC actual ("YYYY-MM-DD")
    const now = new Date();
    const currentUTCDateStr = now.toISOString().split('T')[0];
    
    // Si last_credit_reset no existe o es de un día anterior, reseteamos
    if (!user.last_credit_reset || user.last_credit_reset < currentUTCDateStr) {
      const calculatedCredits = Math.floor((user.total_depositado || 0) / 10);
      return await this.updateUser(userId, {
        creditos_escritura: calculatedCredits,
        last_credit_reset: currentUTCDateStr
      });
    }
    
    return user;
  },

  // Get User by ID
  async getUserById(id) {
    if (useFirestore) {
      const doc = await firestoreDb.collection('users').doc(id).get();
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

  // Get User by Wallet Address (search in linked wallets array/object)
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
        last_credit_reset: now.toISOString().split('T')[0],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };
      const docRef = await firestoreDb.collection('users').add(newUser);
      return { id: docRef.id, ...newUser, createdAt: now.toISOString(), updatedAt: now.toISOString() };
    } else {
      const result = sqliteDb.prepare(`
        INSERT INTO users (email, password_hash, username, google_id, email_verified, avatar_url, google_avatar_url, twitter, discord, telegram, last_credit_reset)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(email, passwordHash, username, googleId, emailVerified ? 1 : 0, avatarUrl, googleAvatarUrl, twitter, discord, telegram, now.toISOString().split('T')[0]);

      const userId = result.lastInsertRowid;

      // Add linked wallets if any
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
    const now = new Date();
    
    // Format incoming updates
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
    if (updates.wallets !== undefined) {
      cleanedUpdates.wallets = updates.wallets;
      cleanedUpdates.walletAddresses = Object.values(updates.wallets).map(addr => addr.toLowerCase());
    }

    if (useFirestore) {
      cleanedUpdates.updatedAt = FieldValue.serverTimestamp();
      await firestoreDb.collection('users').doc(id).update(cleanedUpdates);
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
      if (cleanedUpdates.wallets !== undefined) {
        // Drop old wallets for user and reinsert
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

      // Map and sort in memory to avoid requiring a composite index in Firestore
      const docs = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          createdAtTime: d.createdAt && d.createdAt.toDate ? d.createdAt.toDate().getTime() : 0
        };
      });

      // Sort by createdAt descending
      docs.sort((a, b) => b.createdAtTime - a.createdAtTime);

      const latestCode = docs[0];

      // Check expiry manually
      const expiresAtDate = new Date(latestCode.expiresAt);
      if (expiresAtDate < new Date()) return null; // Expired

      return latestCode;
    } else {
      const record = sqliteDb.prepare(`
        SELECT * FROM verification_codes 
        WHERE LOWER(email) = ? AND code = ? AND used = 0
        ORDER BY created_at DESC LIMIT 1
      `).get(cleanEmail, code);

      if (!record) return null;

      // Check expiry manually
      const expiresAtDate = new Date(record.expires_at);
      if (expiresAtDate < new Date()) return null; // Expired

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

  // Save High Score
  async saveHighScore(userId, score, level, linesCleared, platform = 'html5', walletAddress = null) {
    if (useFirestore) {
      const userRef = firestoreDb.collection('users').doc(String(userId));
      const rankingRef = firestoreDb.doc('leaderboard_torneo/estado_actual');
      
      const result = await firestoreDb.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) throw new Error("User not found");
        const userData = userDoc.data();
        const creditos = userData.creditos_escritura || 0;

        if (creditos <= 0) {
          throw new Error("No tienes créditos suficientes para registrar este récord.");
        }

        const doc = await transaction.get(rankingRef);
        let top10 = doc.exists ? doc.data().top10 || [] : [];
        
        const minScoreParaEntrar = top10.length >= 10 ? top10[9].score : 0;

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

        // Si no entra al TOP 10, consumimos el crédito pero no modificamos leaderboard
        if (score <= minScoreParaEntrar && top10.length >= 10) {
          return { id: null, userId, score, level, linesCleared, rank: 'fuera_del_top' };
        }

        top10.push({
          userId: String(userId),
          username: userData.username || 'Unknown',
          avatarUrl: userData.avatarUrl || null,
          walletAddress,
          platform,
          score,
          level,
          linesCleared,
          createdAt: Timestamp.now()
        });

        // Ordenar descendente y mantener solo 10
        top10.sort((a, b) => b.score - a.score);
        top10 = top10.slice(0, 10);

        transaction.set(rankingRef, { top10 }, { merge: true });

        const myIndex = top10.findIndex(e => e.score === score && e.userId === String(userId));
        return { id: 'top10_doc', userId, score, level, linesCleared, rank: myIndex + 1 };
      });
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

      const tx = sqliteDb.transaction(() => {
        if (score > currentHighScore) {
          sqliteDb.prepare('UPDATE users SET creditos_escritura = creditos_escritura - 1, high_score = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(score, userIdInt);
        } else {
          sqliteDb.prepare('UPDATE users SET creditos_escritura = creditos_escritura - 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(userIdInt);
        }
        
        const rankRecordLocal = sqliteDb.prepare('SELECT COUNT(*) as rank FROM high_scores WHERE score > ?').get(score);
        const rankAntes = (rankRecordLocal.rank || 0) + 1;

        // Si solo mantenemos 10, y el rank es mayor a 10, no lo guardamos en la tabla
        if (rankAntes > 10) {
          return { id: null, userId, score, level, linesCleared, rank: 'fuera_del_top' };
        }

        const result = sqliteDb.prepare(`
          INSERT INTO high_scores (user_id, score, level, lines_cleared, platform)
          VALUES (?, ?, ?, ?, ?)
        `).run(userIdInt, score, level || 1, linesCleared || 0, platform);

        return { id: String(result.lastInsertRowid), userId, score, level, linesCleared, rank: rankAntes };
      });

      return tx();
    }
  },

  // Get Global Leaderboard (Top 10)
  async getLeaderboard(limit = 10) {
    if (useFirestore) {
      const doc = await firestoreDb.doc('leaderboard_torneo/estado_actual').get();
      if (!doc.exists) return [];
      
      const top10 = doc.data().top10 || [];
      return top10.slice(0, limit).map((data, index) => ({
        id: data.userId, // Using userId as id for compatibility
        userId: data.userId,
        username: data.username,
        avatarUrl: data.avatarUrl || null,
        platform: data.platform || 'html5',
        score: data.score,
        level: data.level,
        linesCleared: data.linesCleared,
        createdAt: toIsoString(data.createdAt),
        rank: index + 1
      }));
    } else {
      const scores = sqliteDb.prepare(`
        SELECT h.id, h.user_id, h.score, h.level, h.lines_cleared, h.platform, h.created_at, u.username, u.avatar_url
        FROM high_scores h
        JOIN users u ON h.user_id = u.id
        ORDER BY h.score DESC
        LIMIT ?
      `).all(limit);

      return scores.map((s, i) => ({
        id: String(s.id),
        userId: String(s.user_id),
        username: s.username,
        score: s.score,
        level: s.level,
        linesCleared: s.lines_cleared,
        platform: s.platform || 'html5',
        createdAt: s.created_at,
        avatarUrl: s.avatar_url,
        rank: i + 1
      }));
    }
  },

  // --- Clear all scores (Weekly reset) ---
  clearAllScores: async () => {
    if (useFirestore) {
      await firestoreDb.doc('leaderboard_torneo/estado_actual').set({ top10: [] });
    } else {
      sqliteDb.prepare('DELETE FROM high_scores').run();
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
