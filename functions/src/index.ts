// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript
import * as admin from 'firebase-admin';

admin.initializeApp();

export { basicHTTP, api } from './http';
export { createUserRecord } from './auth';
export { gameCount, userTrend } from './firestore';
