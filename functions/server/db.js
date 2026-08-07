import admin from 'firebase-admin';

// Initialize Firebase Admin (Functions environment automatically provides credentials)
if (!admin.apps.length) {
  if (process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      })
    });
  } else {
    admin.initializeApp();
  }
}

const firestoreDb = admin.firestore();

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

// ─── Database Interface API ───────────────────────────────────────
export const dbAPI = {
  // Obtener todos los usuarios
  async getAllUsers() {
    const snapshot = await firestoreDb.collection('users').get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return { id: doc.id, ...data, createdAt: toIsoString(data.createdAt), updatedAt: toIsoString(data.updatedAt) };
    });
  },

  // Obtener suma total depositada por todos los usuarios
  async getTotalDepositedAllUsers() {
    const snapshot = await firestoreDb.collection('users').get();
    let total = 0;
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      total += (Number(data.total_depositado) || 0);
    });
    return total;
  },

  // Verificación pasiva de créditos diarios
  async checkAndResetDailyCredits(userId) {
    const user = await this.getUserById(userId);
    if (!user) return user;
    
    const now = new Date();
    const currentUTCDateStr = now.toISOString().split('T')[0];
    
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
    const doc = await firestoreDb.collection('users').doc(String(id)).get();
    if (!doc.exists) return null;
    const data = doc.data();
    return { id: doc.id, ...data, createdAt: toIsoString(data.createdAt), updatedAt: toIsoString(data.updatedAt) };
  },

  // Get User by Email
  async getUserByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.toLowerCase().trim();
    const snapshot = await firestoreDb.collection('users').where('email', '==', cleanEmail).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    const data = doc.data();
    return { id: doc.id, ...data, createdAt: toIsoString(data.createdAt), updatedAt: toIsoString(data.updatedAt) };
  },

  // Get User by Google ID
  async getUserByGoogleId(googleId) {
    if (!googleId) return null;
    const snapshot = await firestoreDb.collection('users').where('googleId', '==', googleId).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    const data = doc.data();
    return { id: doc.id, ...data, createdAt: toIsoString(data.createdAt), updatedAt: toIsoString(data.updatedAt) };
  },

  // Get User by Wallet Address
  async getUserByWalletAddress(address) {
    if (!address) return null;
    const cleanAddress = address.toLowerCase().trim();
    const snapshot = await firestoreDb.collection('users')
      .where('walletAddresses', 'array-contains', cleanAddress)
      .limit(1)
      .get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    const data = doc.data();
    return { id: doc.id, ...data, createdAt: toIsoString(data.createdAt), updatedAt: toIsoString(data.updatedAt) };
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
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await firestoreDb.collection('users').add(newUser);
    return { id: docRef.id, ...newUser, createdAt: now.toISOString(), updatedAt: now.toISOString() };
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
    if (updates.wallets !== undefined) {
      cleanedUpdates.wallets = updates.wallets;
      cleanedUpdates.walletAddresses = Object.values(updates.wallets).map(addr => addr.toLowerCase());
    }

    cleanedUpdates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    await firestoreDb.collection('users').doc(String(id)).update(cleanedUpdates);
    return this.getUserById(id);
  },

  // Save Email Verification Code
  async saveVerificationCode(email, code, expiresAt) {
    const cleanEmail = email.toLowerCase().trim();
    await firestoreDb.collection('verification_codes').add({
      email: cleanEmail,
      code,
      expiresAt: expiresAt,
      used: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  },

  // Get verification code record
  async getVerificationCode(email, code) {
    const cleanEmail = email.toLowerCase().trim();
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
    if (expiresAtDate < new Date()) return null; // Expired

    return latestCode;
  },

  // Mark verification code as used
  async markVerificationCodeUsed(id) {
    await firestoreDb.collection('verification_codes').doc(String(id)).update({ used: true });
  },

  // Save High Score
  async saveHighScore(userId, score, level, linesCleared, walletAddress = null) {
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

      const currentHighScore = userData.high_score || 0;
      const updates = {
        creditos_escritura: creditos - 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      if (score > currentHighScore) {
        updates.high_score = score;
      }

      transaction.update(userRef, updates);

      if (score <= minScoreParaEntrar && top10.length >= 10) {
        return { id: null, userId, score, level, linesCleared, rank: 'fuera_del_top' };
      }

      top10.push({
        userId: String(userId),
        username: userData.username || 'Unknown',
        avatarUrl: userData.avatarUrl || null,
        walletAddress,
        score,
        level,
        linesCleared,
        createdAt: admin.firestore.Timestamp.now()
      });

      top10.sort((a, b) => b.score - a.score);
      top10 = top10.slice(0, 10);

      transaction.set(rankingRef, { top10 }, { merge: true });

      const myIndex = top10.findIndex(e => e.score === score && e.userId === String(userId));
      return { id: 'top10_doc', userId, score, level, linesCleared, rank: myIndex + 1 };
    });
    return result;
  },

  // Get Global Leaderboard (Top 10)
  async getLeaderboard(limit = 10) {
    const doc = await firestoreDb.doc('leaderboard_torneo/estado_actual').get();
    if (!doc.exists) return [];
    
    const top10 = doc.data().top10 || [];
    return top10.slice(0, limit).map((data, index) => ({
      id: data.userId, 
      userId: data.userId,
      username: data.username,
      avatarUrl: data.avatarUrl || null,
      score: data.score,
      level: data.level,
      linesCleared: data.linesCleared,
      createdAt: toIsoString(data.createdAt),
      rank: index + 1
    }));
  },

  // --- Clear all scores (Weekly reset) ---
  clearAllScores: async () => {
    await firestoreDb.doc('leaderboard_torneo/estado_actual').set({ top10: [] });
  },

  // --- Contact Messages ---
  saveContactMessage: async (email, message) => {
    try {
      await firestoreDb.collection('contact_messages').add({
        email,
        message,
        status: 'unread',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Firestore saveContactMessage error:', error);
      return false;
    }
  },

  // ─── System Config ────────────────────────────────────────────────────────
  getSystemConfig: async (key) => {
    try {
      const doc = await firestoreDb.collection('config').doc(String(key)).get();
      if (doc.exists) {
        return doc.data().value;
      }
    } catch (e) {
      console.error('getSystemConfig firestore error:', e);
    }
    return null;
  },

  updateSystemConfig: async (key, value) => {
    try {
      await firestoreDb.collection('config').doc(String(key)).set({ value: String(value) });
      return true;
    } catch (e) {
      console.error('updateSystemConfig firestore error:', e);
      return false;
    }
  },

  // ─── Admin Withdrawals History ────────────────────────────────────────────
  getAdminWithdrawals: async () => {
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
  },

  recordAdminWithdrawal: async (amount) => {
    try {
      await firestoreDb.collection('admin_withdrawals').add({
        amount: Number(amount),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return true;
    } catch (e) {
      console.error('recordAdminWithdrawal firestore error:', e);
      return false;
    }
  }
};

export default dbAPI;
