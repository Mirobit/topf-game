import WebSocket from 'ws';
import * as gamesServices from './games.js';
import { verifyToken } from './auth.js';

const games = new Map();
let wss;

const sendMessageGame = (gameId, messageData) => {
  console.log(games);
  const { players } = games.get(gameId);
  players.forEach((player) => {
    player.ws.send(JSON.stringify(messageData));
  });
};

const sendMessagePlayer = (gameId, playerName, messageData) => {
  const { ws } = games
    .get(gameId)
    .players.find((player) => player.info.name === playerName);
  ws.send(messageData);
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
    .players.find(
      (player) => player.info.playerName === playerName
    ).status = newStatus;
  // TODO: Update db
};

const getExplainerName = (gameId) => {
  const explainerName = games
    .get(gameId)
    .players.find((player) => player.action === 'explaining').playerName;
};

const handlePlayerJoined = (gameId, playerName, token, ws) => {
  try {
    verifyToken(gameId, playerName, token);
  } catch ($err) {
    console.log($err);
    // TODO send error per websocket
    return;
  }

  let action = 'none';
  const player = { gameId, playerName, status: 'new', action, ws };
  player.ws.parent = player;

  const game = games.get(gameId);

  if (game) {
    if (game.players.length === 1) action = 'guessing';
    game.players.push(player);
  } else {
    action = 'explaining';
    games.set(gameId, { players: [player] });
  }

  sendMessageGame(gameId, {
    command: 'player_joined',
    payload: { playerName, newStatus: 'new', action },
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
  sendMessageGame(gameId, { command: 'game_start', payload: true });
  const explainerName = getExplainerName(gameId);
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
      handlePlayerLeft(ws.parent.gameId, ws.parent.playerName, code);
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
