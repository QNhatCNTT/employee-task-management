import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { envConfig } from './env-config.js';

let db: Firestore | null = null;

export const initializeFirebase = (): Firestore => {
  if (db) return db;

  const serviceAccount: ServiceAccount = {
    projectId: envConfig.FIREBASE_PROJECT_ID,
    privateKey: envConfig.FIREBASE_PRIVATE_KEY,
    clientEmail: envConfig.FIREBASE_CLIENT_EMAIL,
  };

  const app = initializeApp({ credential: cert(serviceAccount) });
  db = getFirestore(app);
  return db;
};

export const getDb = (): Firestore => {
  if (!db) throw new Error('Firebase not initialized');
  return db;
};
