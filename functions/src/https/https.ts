import * as admin from 'firebase-admin';
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

export const testFirestore = functions.region('europe-west1').https.onRequest(async (req, res) => {
  console.log({ body: req.body });

  const result = await admin
    .firestore()
    .collection('sfyProducts')
    .doc(`${req.body.shop}`)
    .set(req.body);

  return res.status(200).json({ result }).end();
});

export const testUpdateFirestore = functions
  .region('europe-west1')
  .https.onRequest(async (req, res) => {
    console.log({ body: req.body });

    const result = await admin
      .firestore()
      .collection('sfyProducts')
      .doc(req.body.shop)
      .set(req.body, { merge: true });

    return res.status(200).json({ result }).end();
  });

export const api = functions.region('europe-west1').https.onRequest(app);
