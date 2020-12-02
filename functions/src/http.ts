import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as cors from 'cors';

admin.initializeApp();

export const basicHTTP = functions.https.onRequest((req, res) => {
  const name = req.query.name;

  if (!name) {
    res.status(401).json({ error: 'Error: Missing name param' });
  }

  res.status(200).json({ message: `Hello, ${name}!` });
});

const auth = (
  req: express.Request,
  res: express.Response,
  n: express.NextFunction
): void => {
  if (!req.headers.authorization) {
    res.status(400).send('unauthorized');
    return;
  }

  return n();
};

const app = express();

app.use(cors({ origin: true }));
app.use(auth);

app.get('/cat', (req, res) => {
  res.json({ cat: '🐈' });
});

app.get('/dog', (req, res) => {
  res.json({ dog: '🦮' });
});

export const api = functions.https.onRequest(app);