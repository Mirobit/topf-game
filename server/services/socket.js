import WebSocket from 'ws';
import * as gamesServices from './games.js';
import { verifyToken } from './auth.js';

const games = new Map();
let wss;

const sendMessageGame = (gameId, messageData) => {
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
  sendMessageGame(gameId, {
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

const getRandomInt = (max) => Math.floor(Math.random() * Math.floor(max));

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

const handlePlayerJoined = (gameId, playerName, token, ws) => {
  try {
    verifyToken(gameId, playerName, token);
  } catch ($err) {
    console.log($err);
    // TODO send error per websocket
    return;
  }

  const player = {
    gameId,
    name: playerName,
    status: 'new',
    activity: 'none',
    score: 0,
    ws,
  };
  player.ws.gameId = gameId;
  player.ws.playerName = playerName;

  const game = games.get(gameId);

  if (game) {
    if (game.players.length === 1) player.activity = 'guessing';
    game.players.push(player);
  } else {
    const gameDB = gamesServices.get(gameId);
    player.activity = 'explaining';
    games.set(gameId, {
      players: [player],
      words: [],
      currentRound: 1,
      totalRounds: gameDB.totalRounds,
      adminName: gamesServices.adminName,
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
  sendMessageGame(gameId, {
    command: 'player_joined',
    payload: {
      playerName,
      newStatus: 'new',
      activity: player.activity,
      score: player.score,
    },
  });
};

const handlePlayerLeft = (gameId, playerName, code) => {
  const newStatus = code === 10005 ? 'quit' : 'disconnected';
  updatePlayerStatus(gameId, playerName, newStatus);
  messagePlayerStatus(gameId, playerName, newStatus);
};

const handlePlayerStatusChange = (gameId, playerName, newStatus) => {
  updatePlayerStatus(gameId, playerName, newStatus);
  messagePlayerStatus(gameId, playerName, newStatus);
};

const handleTurnStart = (gameId) => {
  const explainerName = getExplainerName(gameId);
  const words = getRandomizedWords(gameId);
  sendMessageGame(gameId, { command: 'game_turn_start', payload: '' });
  sendMessagePlayer(gameId, explainerName, {
    command: 'game_words',
    payload: { words },
  });
};

const handleWordsSubmitted = (gameId, playerName, words) => {
  const game = games.get(gameId);
  for (const word of words) {
    game.words.push({ string: word, guessed: false });
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
  sendMessageGame(gameId, {
    command: 'game_finished',
    payload: { winner, score: highscore },
  });
  game.status = 'finished';
};

const setNextTurn = (gameId, finishedRound) => {
  const game = games.get(gameId);
  console.log('timeleft', game.timeLeft);
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
    sendMessageGame(gameId, {
      command: 'game_next_round',
      payload: { roundNo: game.currentRound },
    });
  }

  sendMessageGame(gameId, {
    command: 'game_player_list',
    payload: { players: getPlayersLean(gameId) },
  });
};

const handlePlayerFinished = (gameId, words, timeLeft) => {
  const game = games.get(gameId);
  const player = game.players.find(
    (playerT) => playerT.activity === 'guessing'
  );
  let points = 0;

  for (const word of words) {
    if (word.guessed) {
      points++;
      game.words.find((wordT) => wordT.string === word.string).guessed = true;
    }
  }
  player.score += points;

  sendMessageGame(gameId, {
    command: 'player_words_guessed',
    payload: { points, playerName: player.name, roundNo: game.currentRound },
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

const messageHandler = (message, ws) => {
  switch (message.command) {
    case 'player_status':
      handlePlayerStatusChange(
        message.gameId,
        message.playerName,
        message.payload.newStatus
      );
      break;
    case 'player_finished':
      handlePlayerFinished(
        message.gameId,
        message.payload.words,
        message.payload.timeLeft
      );
      break;
    case 'player_joined':
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
    case 'game_turn_start':
      handleTurnStart(message.gameId);
      break;
    default:
      console.log('unknown command', message.command);
  }
};

const init = (server) => {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('new connection');
    ws.on('message', (message) => {
      console.log('message from', JSON.parse(message));
      messageHandler(JSON.parse(message), ws);
    });
    ws.on('close', (code) => {
      console.log('innerclose:', code);
      handlePlayerLeft(ws.gameId, ws.playerName, code);
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
