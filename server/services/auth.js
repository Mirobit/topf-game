const jwt = require('jsonwebtoken');
const { AuthError } = require('../utils/errors');

const verifyToken = (playerName, token) => {
  jwt.verify(token, process.env.JWT_SECRET, (error, payload) => {
    if (error) {
      if (error.name === 'TokenExpiredError')
        throw new AuthError('Sessions expired, please login');
      else throw new AuthError('Invalid session, please logout');
    } else if (payload.playerName !== playerName) {
      throw new AuthError('Invalid user');
    } else {
      throw new AuthError('Not signed in');
    }
  });
};

const createToken = (gameId, playerName, role) =>
  jwt.sign({ gameId, playerName, role }, process.env.JWT_SECRET, {
    expiresIn: 86400,
  });

module.exports = { verifyToken, createToken };
