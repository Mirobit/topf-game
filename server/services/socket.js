const WebSocket = require('ws');
const gamesServices = require('./games');
const { verifyToken } = require('./auth');

const games = new Map();
let wss;

const sendMessageGame = (gameId, data) => {
  const { players } = games.get(gameId);
  players.forEach((ws) => {
    ws.send(JSON.stringify(data));
  });
};

const sendMessagePlayer = (gameId, playerName, data) => {
  const ws = games.get(gameId).find((player) => player.name === playerName);
  ws.send(data);
};

const updatePlayerStatus = (gameId, playerName, status) => {
  sendMessageGame(gameId, {
    command: 'player_status',
    payload: { playerName, status },
  });
};

const playerJoined = (message, ws) => {
  try {
    verifyToken(message.gameId, message.playerName, message.payload.token);
  } catch ($err) {
    console.log($err);
    // TODO send error per websocket
    return;
  }

  ws.playerName = message.playerName;
  ws.gameId = message.gameId;
  if (games.has(message.gameId)) {
    games.get(message.gameId).players.push(ws);
  } else {
    games.set(message.gameId, { players: [ws] });
  }
};

const playerLeft = (gameId, playerName, code) => {
  const status = code === 10005 ? 'quit' : 'disconnected';
  updatePlayerStatus(gameId, playerName, status);
  // Update db
};

const gameStart = (gameId) => {
  sendMessageGame(gameId, { command: 'game_start', payload: true });
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
      updatePlayerStatus(message.gameId, message.playerName, message.payload);
      break;
    case 'player_join':
      playerJoined(message, ws);
      break;
    case 'game_start':
      gameStart(message.gameId);
      break;
    case 'player_words_submitted':
      gamesServices.addWords(
        message.gameId,
        message.playerName,
        message.payload
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
      playerLeft(ws.gameId, ws.playerName, code);
    });
    ws.on('error', (data) => {
      console.log('innererror', data);
    });
  });

  // wss.on('message', (message) => {
  //   console.log('asd', message);
  // });

  // wss.on('close', (ws) => {
  //   console.log(`${ws.playerName} left game`);
  // });

  wss.on('error', (error) => {
    console.log(error);
  });

  return wss;
};

module.exports = init;
