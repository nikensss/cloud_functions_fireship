import { region, logger } from 'firebase-functions';

export const doTheFlop = region('europe-west1')
  .pubsub.topic('do-the-flop')
  .onPublish(async message => {
    logger.debug('Pub/Sub message', { pubsubMessage: { topic: 'do-the-flop', ...message } });
  });
