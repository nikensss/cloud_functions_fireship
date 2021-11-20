import { Router } from 'express';

const router = Router();

router.get('/:fruitName', (req, res) => {
  const { fruitName } = req.params;

  if (fruitName === 'apple') {
    return res.status(200).send({ fruitName, emoji: '🍎' });
  }

  return res.status(200).send({ fruitName, emoji: '🎰' });
});

export const fruits = router;
