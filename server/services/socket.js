import WebSocket from 'ws';
import pino from 'pino';

import * as gamesServices from './games.js';
import { verifyToken } from './auth.js';
import { hash } from '../utils/crypter.js';

const logger = pino('./error.log');
const games = new Map();
let wss;

const sendMessageAll = (gameId, messageData) => {
  console.log('message to', gameId, messageData);
  const { players } = games.get(gameId);
  players.forEach((player) => {
    player.ws.send(JSON.stringify(messageData));
  });
};

const sendMessagePlayer = (gameId, playerName, messageData) => {
  console.log('private message to', gameId, playerName, messageData);
  const { ws } = games
    .get(gameId)
    .players.find((player) => player.name === playerName);
  ws.send(JSON.stringify(messageData));
};

const messagePlayerStatus = (gameId, playerName, newStatus) => {
  sendMessageAll(gameId, {
    command: 'player_status',
    payload: { playerName, newStatus },
  });
};

const updatePlayerStatus = (gameId, playerName, newStatus) => {
  games
    .get(gameId)
    .players.find((player) => player.name === playerName).status = newStatus;
  // TODO: Update db
};

const getExplainerName = (gameId) => {
  const explainerName = games
    .get(gameId)
    .players.find((player) => player.activity === 'explaining').name;
  return explainerName;
};

const getGuesserName = (gameId) => {
  const guesserName = games
    .get(gameId)
    .players.find((player) => player.activity === 'guessing').name;
  return guesserName;
};

const getRandomInt = (max) => Math.floor(Math.random() * max);

const getRandomizedWords = (gameId) => {
  const words = games.get(gameId).words.filter((word) => !word.guessed);

  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }

  return words;
};

const getPlayersLean = (gameId) =>
  games.get(gameId).players.reduce((acc, cur) => {
    acc.push({
      name: cur.name,
      status: cur.status,
      activity: cur.activity,
      score: cur.score,
    });
    return acc;
  }, []);

const handlePlayerJoined = async (gameId, playerName, token, ws) => {
  try {
    verifyToken(gameId, playerName, token);
  } catch ($err) {
    console.log($err);
    // TODO send error per websocket
    return;
  }

  let player = {
    gameId,
    name: playerName,
    status: 'unready',
    activity: 'none',
    score: 0,
    avatar: 'default.jpg',
    hasSubmittedWords: false,
    ws,
  };
  player.ws.gameId = gameId;
  player.ws.playerName = playerName;

  const game = games.get(gameId);

  if (game) {
    const existingPlayer = game.players.find(
      (tPlayer) => tPlayer.name === playerName
    );
    if (existingPlayer) {
      existingPlayer.status = 'unready';
      existingPlayer.ws = ws;
      existingPlayer.ws.gameId = gameId;
      existingPlayer.ws.playerName = playerName;
      player = existingPlayer;
      sendMessagePlayer(gameId, playerName, {
        command: 'player_store_update',
        payload: {
          score: player.score,
          activity: player.activity,
          hasSubmittedWords: player.hasSubmittedWords,
        },
      });
    } else {
      if (game.players.length === 1) player.activity = 'guessing';
      game.players.push(player);
    }
  } else {
    const gameDB = await gamesServices.get(gameId);
    player.activity = 'explaining';
    games.set(gameId, {
      players: [player],
      words: [],
      currentRound: 1,
      totalRounds: gameDB.totalRounds,
      adminName: gameDB.adminName,
      status: gameDB.status,
      timeLeft: 0,
    });
  }

  sendMessagePlayer(gameId, playerName, {
    command: 'game_player_list',
    payload: {
      players: getPlayersLean(gameId),
    },
  });
  sendMessageAll(gameId, {
    command: 'player_joined',
    payload: {
      playerName,
      newStatus: 'unready',
      activity: player.activity,
      score: player.score,
    },
  });
};

const handlePlayerConnectionClosed = (gameId, playerName, code) => {
  // code === 10005
  const newStatus = 'disconnected';
  updatePlayerStatus(gameId, playerName, newStatus);
  messagePlayerStatus(gameId, playerName, newStatus);
};

const handlePlayerStatusChange = (gameId, playerName, newStatus) => {
  updatePlayerStatus(gameId, playerName, newStatus);
  messagePlayerStatus(gameId, playerName, newStatus);
};

const handleTurnStart = (gameId) => {
  const explainerName = getExplainerName(gameId);
  const guesserName = getGuesserName(gameId);
  const words = getRandomizedWords(gameId);

  sendMessagePlayer(gameId, explainerName, {
    command: 'game_set_explain',
    payload: { words },
  });
  sendMessagePlayer(gameId, guesserName, {
    command: 'game_set_guess',
    payload: {},
  });
  sendMessageAll(gameId, { command: 'game_turn_start', payload: '' });
};

const handleWordsSubmitted = (gameId, playerName, words) => {
  const game = games.get(gameId);
  game.players.find(
    (player) => player.name === playerName
  ).hasSubmittedWords = true;
  for (const word of words) {
    game.words.push({
      id: hash(word + playerName),
      string: word,
      guessed: false,
    });
  }
};

const setGameFinished = (gameId) => {
  const game = games.get(gameId);
  let winner = 'error';
  let highscore = 0;
  for (const player of game.players) {
    if (player.score > highscore) {
      winner = player.name;
      highscore = player.score;
    }
  }
  sendMessageAll(gameId, {
    command: 'game_player_list',
    payload: { players: getPlayersLean(gameId) },
  });
  sendMessageAll(gameId, {
    command: 'game_finished',
    payload: { winner, score: highscore },
  });
  game.status = 'finished';
};

const setNextTurn = (gameId, finishedRound) => {
  const game = games.get(gameId);
  // Set next player pair
  if (game.timeLeft === 0) {
    console.log('new player pair');
    const curExplainerIndex = game.players.findIndex(
      (player) => player.activity === 'explaining'
    );
    const curGuesserIndex = game.players.findIndex(
      (player) => player.activity === 'guessing'
    );

    game.players[curExplainerIndex].activity = 'none';
    game.players[curGuesserIndex].activity = 'none';

    const newExplainerIndex =
      curExplainerIndex < game.players.length - 1 ? curExplainerIndex + 1 : 0;
    const newGuesserIndex =
      curGuesserIndex < game.players.length - 1 ? curGuesserIndex + 1 : 0;
    console.log('guesser', curGuesserIndex, newGuesserIndex);
    console.log('explainer', curExplainerIndex, newExplainerIndex);
    game.players[newExplainerIndex].activity = 'explaining';
    game.players[newGuesserIndex].activity = 'guessing';
  }

  console.log('finished round', finishedRound);
  // Set next round
  if (finishedRound) {
    game.words = game.words.map((word) => {
      word.guessed = false;
      return word;
    });
    game.currentRound++;
    sendMessageAll(gameId, {
      command: 'game_next_round',
      payload: { roundNo: game.currentRound },
    });
  }

  sendMessageAll(gameId, {
    command: 'game_player_list',
    payload: { players: getPlayersLean(gameId) },
  });
};

const handleTurnFinished = (gameId, words, timeLeft) => {
  const game = games.get(gameId);
  const playerG = game.players.find((player) => player.activity === 'guessing');
  const playerE = game.players.find(
    (player) => player.activity === 'explaining'
  );
  let points = 0;

  for (const word of words) {
    if (word.guessed) {
      points++;
      game.words.find((wordT) => wordT.id === word.id).guessed = true;
    }
  }
  playerG.score += points;
  playerE.score += points;

  sendMessageAll(gameId, {
    command: 'player_words_guessed',
    payload: {
      points,
      playerName: playerG.name,
      roundNo: game.currentRound,
      timeLeft,
    },
  });

  let roundFinished = true;
  for (const word of game.words) {
    if (!word.guessed) {
      roundFinished = false;
      break;
    }
  }

  if (roundFinished && game.totalRounds === game.currentRound) {
    setGameFinished(gameId);
  } else {
    game.timeLeft = timeLeft;
    setNextTurn(gameId, roundFinished);
  }
};

const handleShuffelPlayers = (gameId) => {
  const { players } = games.get(gameId);

  for (let i = players.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [players[i], players[j]] = [players[j], players[i]];
  }

  for (let i = 0; i < players.length; i++) {
    if (i === 0) players[i].activity = 'explaining';
    else if (i === 1) players[i].activity = 'guessing';
    else players[i].activity = 'none';
  }

  sendMessageAll(gameId, {
    command: 'game_player_list',
    payload: { players: getPlayersLean(gameId) },
  });
};

const handleRemovePlayer = (gameId, playerName) => {
  const game = games.get(gameId);
  game.players = game.players.filter((player) => player.name !== playerName);

  sendMessageAll(gameId, {
    command: 'game_player_list',
    payload: { players: getPlayersLean(gameId) },
  });
  // TODO: Update db
};

const messageHandler = (message, ws) => {
  switch (message.command) {
    case 'game_turn_finished':
      handleTurnFinished(
        message.gameId,
        message.payload.words,
        message.payload.timeLeft
      );
      break;
    case 'game_turn_start':
      handleTurnStart(message.gameId);
      break;
    case 'player_status':
      handlePlayerStatusChange(
        message.gameId,
        message.playerName,
        message.payload.newStatus
      );
      break;
    case 'player_joined':
      console.log(message);
      handlePlayerJoined(
        message.gameId,
        message.playerName,
        message.payload.token,
        ws
      );
      break;
    case 'player_words_submitted':
      handleWordsSubmitted(
        message.gameId,
        message.playerName,
        message.payload.words
      );
      break;
    case 'game_shuffel_players':
      handleShuffelPlayers(message.gameId);
      break;
    case 'game_remove_player':
      handleRemovePlayer(message.gameId, message.payload.playerName);
      break;
    default:
      console.log('unknown command', message.command);
  }
};

const handleError = (error, ws) => {
  let { message } = error;
  if (!error.status) {
    message = 'server';
    if (process.env.NODE_ENV === 'development') console.log(error);
    else logger.info(error);
  }
  // try {
  //   sendMessagePlayer(ws.gameId, ws.playerName, {
  //     command: 'error',
  //     payload: { message: 'Unexpected error. Server closed the connection' },
  //   });
  // } catch (err) {
  //   // Do nothing
  // }
  try {
    ws.close();
  } catch (err) {
    // Do nothing
  }
};

const init = (server) => {
  wss = new WebSocket.Server({ server });
  wss.on('connection', (ws) => {
    ws.on('message', (message) => {
      try {
        console.log('message from', JSON.parse(message));
        messageHandler(JSON.parse(message), ws);
      } catch (error) {
        handleError(error, ws);
      }
    });
    ws.on('close', (code) => {
      try {
        console.log('innerclose:', code);
        handlePlayerConnectionClosed(ws.gameId, ws.playerName, code);
      } catch (error) {
        handleError(error, ws);
      }
    });
    ws.on('error', (data) => {
      console.log('innererror', data);
    });
  });
  wss.on('error', (error) => {
    console.log(error);
  });

  return wss;
};

export default init;
