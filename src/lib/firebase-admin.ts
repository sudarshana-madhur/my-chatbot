import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Avoid initializing multiple apps during hot reloading in development
if (!admin.apps.length) {
  // Using process.cwd() ensures reliable path resolution in Next.js
  const serviceAccountPath = path.join(process.cwd(), 'adminsdk.json');
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

export { db, admin };
