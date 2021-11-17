import { Router } from 'express';
import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions';

const db = admin.firestore();
const router = Router();

const createTransaction = (transactionName: string) => {
  return db.runTransaction(async (t) => {
    logger.info(`starting ${transactionName}`);
    logger.info(`getting document ${transactionName}`);
    const docRef = db.collection('sfyProducts').doc('katana');
    const doc = await t.get(docRef);
    logger.info(`got document ${transactionName}`);
    logger.log(`id before waiting: ${doc.get('id')}`);
    logger.info(`waiting in ${transactionName}`);
    await new Promise((resolve) => setTimeout(resolve, 2 * 1000));
    logger.info(`done waiting in ${transactionName}`);
    t.set(docRef, { id: transactionName }, { merge: true });
    logger.info(`${transactionName} set, returning`);
    return `${transactionName} finished`;
  });
};

router.post('/', async (req, res) => {
  const { transactionAmount } = req.body;
  const _transactions = await Promise.all(
    new Array(transactionAmount || 2)
      .fill(null)
      .map((e, i) => createTransaction(`transaction ${i}`))
  );
  return res.status(200).send({ transactions: _transactions });
});

export const transactions = router;
