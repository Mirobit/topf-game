import jwt from 'jsonwebtoken';
import { AuthError } from '../utils/errors.js';

const verifyToken = (gameId, playerName, token) => {
  // TODO make promise
  return new Promise((resolve) => {
    jwt.verify(token, process.env.JWT_SECRET, (error, payload) => {
      if (error) {
        if (error.name === 'TokenExpiredError') {
          throw new AuthError('Sessions expired, please login');
        } else {
          throw new AuthError('Invalid session, please logout');
        }
      } else if (payload.playerName !== playerName) {
        throw new AuthError('Different player name');
      } else if (payload.gameId !== gameId) {
        throw new AuthError('Invalid game');
      }
      resolve(payload);
    });
  });
};

const createToken = (gameId, playerName, role) =>
  jwt.sign({ gameId, playerName, role }, process.env.JWT_SECRET, {
    expiresIn: 86400,
  });

export { verifyToken, createToken };
