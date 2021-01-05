const WebSocket = require('ws');
const gamesServices = require('./games');

const channels = new Map();

const addPlayer = (ws) => {
  //
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

const init = (server) => {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('new connection');
    ws.on('message', (message) => {
      console.log(JSON.parse(message));
    });
  });

  wss.on('message', (message) => {
    console.log('asd', message);
  });

  return wss;
};

module.exports = init;
