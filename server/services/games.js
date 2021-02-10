import Game from '../models/Game.js';
import { hash } from '../utils/crypter.js';
import { createToken } from './auth.js';
import { ValError } from '../utils/errors.js';

// const get = async (id) => {
//   try {
//     const game = await Game.findById(id);
//     return game;
//   } catch (error) {
//     throw new Error(error.message);
//   }
// };

// const list = async () => {
//   try {
//     const games = await Game.find({}, null, { sort: { created_at: -1 } });
//     return games;
//   } catch (error) {
//     throw new Error(error.message);
//   }
// };

const create = async (data) => {
  const game = await new Game(data);
  if (data.password) game.password = hash(data.password);
  await game.save();
  return game._id;
};

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

const join = async (gameId, playerName, gamePassword) => {
  const game = await Game.findById(gameId).lean();

  if (game.password && hash(gamePassword) !== game.password) {
    throw new ValError('Invalid game password');
  }

  let role = 'user';
  if (playerName === game.adminName) role = 'admin';

  // if (
  //   game.players.some(
  //     (player) => player.name.toUpperCase() === playerName.toUpperCase()
  //   )
  // ) {
  //   throw new ValError('Player name already in use');
  // }
  // game.players.push({ name: playerName, role });
  // await game.save();

  game.id = game._id;

  delete game._id;
  delete game.password;
  delete game.players;
  delete game.words;
  delete game.updated_at;

  const token = createToken(gameId, playerName, role);

  return { game, token };
};

export { create, join };
