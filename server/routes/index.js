const express = require('express');
const path = require('path');
const gameRoutes = require('./api/games');

const router = express.Router();

// API
router.use('/api/game', gameRoutes);

// App
router.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

router.use((req, res) => {
  res.status(404).send({ error: 'not-found' });
});

module.exports = router;
