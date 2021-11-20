import * as cors from 'cors';
import * as express from 'express';
import * as functions from 'firebase-functions';
import { fruits } from './fruits';
import { transactions } from './transactions';

const logger = (
  req: express.Request,
  res: express.Response,
  n: express.NextFunction
) => {
  functions.logger.info(`Request received at: ${new Date()}`);
  n();
};

const auth = (
  req: express.Request,
  res: express.Response,
  n: express.NextFunction
): void => {
  if (req.method === 'POST' && !req.headers.authorization) {
    return res.sendStatus(418).end();
  }

  n();
};

export const app = express();

app.use(cors({ origin: true }));
app.use(logger);
app.use(auth);

app.get('/cat', (req, res) => {
  return res.status(200).json({ cat: '🐈' });
});

app.get('/dog', (req, res) => {
  return res.status(200).json({ dog: '🦮' });
});

app.use('/fruits', fruits);

app.use('/transactions', transactions);

app.post('/headers', (req, res) => {
  return res
    .status(200)
    .json({ headers: req.headers, rawHeaders: req.rawHeaders });
});
