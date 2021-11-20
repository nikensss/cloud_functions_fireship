import * as functions from 'firebase-functions';
import { app } from './api';

export const basicHTTP = functions.region('europe-west1').https.onRequest((req, res) => {
  functions.logger.info('Hello logs!', { structuredData: true });
  const name = req.query.name;

  if (!name) {
    res.status(401).json({ error: 'Error: Missing name param' });
    return;
  }

  res.status(200).json({ message: `Hello, ${name}!` });
  return;
});

export const api = functions.region('europe-west1').https.onRequest(app);
