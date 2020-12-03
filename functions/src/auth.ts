import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

export const createUserRecord = functions.auth
  .user()
  .onCreate((user, context) => {
    console.log(`new user created: ${user.displayName}`);

    const userRef = db.doc(`users/${user.uid}`);

    //REALLY IMPORTANT TO RETURN A PROMISE!!!
    //Otherwise, this functions will error-out
    return userRef.set({
      name: user.displayName,
      createdAt: context.timestamp,
      nickname: `Mr. User`
    });
  });
