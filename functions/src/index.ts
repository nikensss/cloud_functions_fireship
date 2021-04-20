// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript
import * as admin from 'firebase-admin';

admin.initializeApp();

export { createUserRecord } from './auth';
export { gameCount, testFirestore, testUpdateFirestore, userTrend } from './firestore';
export { api, basicHTTP } from './http';
