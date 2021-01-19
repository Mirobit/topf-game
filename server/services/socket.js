import WebSocket from 'ws';
import * as gamesServices from './games.js';
import { verifyToken } from './auth.js';

const games = new Map();
let wss;

const sendMessageGame = (gameId, messageData) => {
  const { players } = games.get(gameId);
  players.forEach((player) => {
    player.ws.send(JSON.stringify(messageData));
  });
};

const sendMessagePlayer = (gameId, playerName, messageData) => {
  const { ws } = games
    .get(gameId)
    .players.find((player) => player.name === playerName);
  console.log(messageData);
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
    .players.find((player) => player.action === 'explaining').name;
};

const getRandomInt = (max) => Math.floor(Math.random() * Math.floor(max));

const getRandomizedWords = (gameId) => {
  const { words } = games.get(gameId).filter((word) => !word.guessed);

  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }

  return words;
};

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
    action: 'none',
    ws,
  };
  player.ws.gameId = gameId;
  player.ws.playerName = playerName;

  const game = games.get(gameId);

  if (game) {
    if (game.players.length === 1) player.action = 'guessing';
    game.players.push(player);
  } else {
    player.action = 'explaining';
    games.set(gameId, { players: [player] });
  }

  sendMessagePlayer(gameId, playerName, {
    command: 'game_player_list',
    payload: {
      players: games.get(gameId).players.reduce((acc, cur) => {
        acc.push({
          name: cur.name,
          status: cur.status,
          action: cur.action,
        });
        return acc;
      }, []),
    },
  });
  sendMessageGame(gameId, {
    command: 'player_joined',
    payload: { playerName, newStatus: 'new', action: player.action },
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

const handleGameStart = (gameId) => {
  const explainerName = getExplainerName(gameId);
  const words = getRandomizedWords(gameId);
  sendMessageGame(gameId, { command: 'game_start', payload: true });
  sendMessagePlayer(gameId, explainerName, {
    command: 'game_words',
    payload: { words },
  });
};

const endGame = (gameId) => {
  //
};

const nextRound = (gameId) => {
  //
};

const createChannel = () => {
  //
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
    case 'player_joined':
      handlePlayerJoined(
        message.gameId,
        message.playerName,
        message.payload.token,
        ws
      );
      break;
    case 'game_start':
      handleGameStart(message.gameId);
      break;
    case 'player_words_submitted':
      gamesServices.addWords(
        message.gameId,
        message.playerName,
        message.payload.words
      );
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
      console.log(JSON.parse(message));
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
