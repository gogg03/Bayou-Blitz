import { Router } from 'express';
import { addScore, getLeaderboard } from '../db';

const router = Router();

router.post('/scores', (req, res) => {
  const { name, score } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }
  if (typeof score !== 'number' || score < 0) {
    res.status(400).json({ error: 'Valid score is required' });
    return;
  }

  addScore(name.trim(), score);
  res.status(201).json({ success: true });
});

router.get('/scores', (_req, res) => {
  const scores = getLeaderboard();
  res.json(scores);
});

export default router;
