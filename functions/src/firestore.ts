import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const gameCount = functions.firestore
  .document('games/{gameId}')
  .onCreate(async (snapshot, context) => {
    //we make this function async so we make sure we return a promise
    //snapshot: snapshot of the document, so no updates are visible
    const data = snapshot.data();

    const userRef = db.doc(`users/${data.uid}`);

    const userSnap = await userRef.get();
    const userData = userSnap.data();

    return userRef.update({
      gameCount: userData?.gameCount + 1
    });
  });

export const userTrend = functions.firestore
  .document('games/{gameId}')
  .onUpdate((snapshot, context) => {
    const before = snapshot.before.data();
    const after = snapshot.after.data();

    let trend = 'not improving';

    if (after.score >= before.score) {
      trend = 'improving';
    }

    const userRef = db.doc(`users/${before.uid}`);

    return userRef.update({
      trend
    });
  });
