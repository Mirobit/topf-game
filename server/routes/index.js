import express from 'express';
import path from 'path';
import gameRoutes from './api/games.js';
import dirname from '../utils/dirname.cjs';

const router = express.Router();

// API
router.use('/api/game', gameRoutes);

// App
router.get('/*', (req, res) => {
  res.sendFile(path.join(dirname, '../../frontend/index.html'));
});

router.use((req, res) => {
  res.status(404).send({ error: 'not-found' });
});

export default router;
