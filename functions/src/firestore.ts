import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

const db = admin.firestore();

export const gameCount = functions.firestore
  .document('games/{gameId}')
  .onCreate(async (snapshot) => {
    //we make this function async so we make sure we return a promise
    //snapshot: snapshot of the document, so no updates are visible
    const data = snapshot.data();

    const userRef = db.doc(`users/${data.uid}`);

    const userSnap = await userRef.get();
    const userData = userSnap.data();

    return await userRef.update({
      gameCount: userData?.gameCount + 1
    });
  });

export const userTrend = functions.firestore
  .document('games/{gameId}')
  .onUpdate(async (snapshot) => {
    const before = snapshot.before.data();
    const after = snapshot.after.data();

    let trend = 'not improving';

    if (after.score >= before.score) {
      trend = 'improving';
    }

    const userRef = db.doc(`users/${before.uid}`);

    return await userRef.update({
      trend
    });
  });

export const testFirestore = functions.region('europe-west1').https.onRequest(async (req, res) => {
  console.log({ body: req.body });

  const result = await admin
    .firestore()
    .collection('sfyProducts')
    .doc(`${req.body.shop}`)
    .set(req.body);

  res.status(200).json({ result }).end();
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

    res.status(200).json({ result }).end();
  });
