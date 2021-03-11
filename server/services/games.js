import Game from '../models/Game.js';
import { hash } from '../utils/crypter.js';
import { createToken, verifyToken } from './auth.js';
import { ValError } from '../utils/errors.js';

const get = async (id) => {
  const game = await Game.findById(id).lean();
  if (!game) {
    throw new ValError('Game does not exists');
  }
  const hasPassword = game.password !== '';
  return { name: game.name, hasPassword };
};

const create = async (data) => {
  const game = await new Game(data);
  if (data.password) game.password = hash(data.password);
  await game.save();
  return game._id;
};

const join = async (gameId, playerName, gamePassword, oldToken) => {
  let game = await Game.findById(gameId);

  if (!game) {
    throw new ValError('Game does not exists');
  }

  let payload;
  if (oldToken) {
    console.log('gameservives old token', oldToken);
    payload = await verifyToken(gameId, playerName, oldToken);
  }

  if (game.password && !payload && hash(gamePassword) !== game.password) {
    throw new ValError('Invalid game password');
  }

  let role = 'user';
  if (playerName === game.adminName) role = 'admin';

  const existingPlayer = game.players.find(
    (player) => player.name.toUpperCase() === playerName.toUpperCase()
  );

  if (existingPlayer && !oldToken) {
    throw new ValError('Player name already in use');
  } else if (!existingPlayer) {
    game.players.push({ name: playerName, role });
    await game.save();
  }
  game = game.toObject();
  game.id = game._id;
  delete game._id;
  delete game.password;
  delete game.players;
  delete game.words;
  delete game.updated_at;

  const token = createToken(gameId, playerName, role);
  return { game, token };
};

// const list = async () => {
//   try {
//     const games = await Game.find({}, null, { sort: { created_at: -1 } });
//     return games;
//   } catch (error) {
//     throw new Error(error.message);
//   }
// };

// const update = async (id, data) => {
//   try {
//     await Game.findOneAndUpdate({ _id: id }, data, {
//       new: true,
//       runValidators: true,
//     });
//     return;
//   } catch (error) {
//     throw new Error(error.message);
//   }
// };

// const remove = async (id) => {
//   try {
//     await Game.findOneAndDelete({ _id: id });
//     return;
//   } catch (error) {
//     throw new Error(error.message);
//   }
// };

export { get, create, join };
