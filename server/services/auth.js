import jwt from 'jsonwebtoken';
import { AuthError } from '../utils/errors.js';

const verifyToken = (gameId, playerName, token) => {
  jwt.verify(token, process.env.JWT_SECRET, (error, payload) => {
    if (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AuthError('Sessions expired, please login');
      } else {
        console.log(error);
        throw new AuthError('Invalid session, please logout');
      }
    } else if (payload.playerName !== playerName) {
      throw new AuthError('Invalid user');
    } else if (payload.gameId !== gameId) {
      console.log(payload, gameId);
      throw new AuthError('Invalid game');
    }
    return payload;
  });
};

const createToken = (gameId, playerName, role) =>
  jwt.sign({ gameId, playerName, role }, process.env.JWT_SECRET, {
    expiresIn: 86400,
  });

export { verifyToken, createToken };
