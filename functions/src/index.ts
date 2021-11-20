// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript
import * as admin from 'firebase-admin';

admin.initializeApp();

export { createUserRecord } from './auth/auth';
export { gameCount, userTrend } from './firestore/firestore';
export { api, basicHTTP, testFirestore, testUpdateFirestore } from './https/https';
