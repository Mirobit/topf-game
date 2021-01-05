const WebSocket = require('ws');
const gamesServices = require('./games');

const games = new Map();
let wss;

const sendMessageGame = (gameId, data) => {
  console.log(gameId);
  console.log(games.get(gameId));
  const { players } = games.get(gameId);
  players.forEach((ws) => {
    ws.send(JSON.stringify(data));
  });
};

const sendMessagePlayer = (gameId, playerName, data) => {
  const ws = games.get(gameId).find((player) => player.name === playerName);
  ws.send(data);
};

const addPlayer = (message, ws) => {
  ws.playerName = message.playerName;
  ws.gameId = message.gameId;
  if (games.has(message.gameId)) {
    games.get(message.gameId).players.push(ws);
  } else {
    games.set(message.gameId, { players: [ws] });
  }
  console.log(games);
};

const removePlayer = (ws) => {
  //
};

const startGame = (gameId) => {
  //
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

const updatePlayerStatus = (message) => {
  sendMessageGame(message.gameId, {
    command: 'player_status',
    value: message.value,
  });
};

const messageHandler = (message, ws) => {
  switch (message.command) {
    case 'player_status':
      updatePlayerStatus(message);
      break;
    case 'player_join':
      addPlayer(message, ws);
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
  });

  // wss.on('message', (message) => {
  //   console.log('asd', message);
  // });

  wss.on('close', () => {
    console.log('player disconnected');
  });

  return wss;
};

module.exports = init;
