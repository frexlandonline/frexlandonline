import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Database from 'better-sqlite3';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, 'data');

async function resetAll() {
  if (fs.existsSync(dataDir)) {
    const sqliteDb = new Database(path.join(dataDir, 'blockdrop.db'));
    try {
      sqliteDb.exec(`
        UPDATE users SET creditos_escritura = 0, total_depositado = 0;
      `);
      console.log('Reset SQLite creditos to 0');
    } catch(e) {
      console.error('Error reset sqlite:', e);
    }
  }

  const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
  const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (firebaseProjectId && firebaseClientEmail && firebasePrivateKey) {
    try {
      const privateKey = firebasePrivateKey.replace(/\\n/g, '\n');
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: firebaseProjectId,
          clientEmail: firebaseClientEmail,
          privateKey: privateKey,
        })
      });
      const db = admin.firestore();
      
      const usersSnapshot = await db.collection('users').get();
      const batch = db.batch();
      usersSnapshot.forEach((doc) => {
        batch.update(doc.ref, {
          creditos_escritura: 0,
          total_depositado: 0
        });
      });
      
      await batch.commit();
      console.log('Reset Firestore creditos to 0 for all users');
    } catch (e) {
      console.error('Error reset firestore:', e);
    }
  }
}

resetAll().then(() => process.exit(0));
