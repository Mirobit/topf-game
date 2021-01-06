import { displayMessage } from './components/message.js';
import Store from './store.js';

let ws;
let messageHandler;

const initWs = (mH) => {
  messageHandler = mH;
  const baseUrl = window.location.host;
  const sProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
  const socketUrl = sProtocol + baseUrl;

  ws = new WebSocket(socketUrl);

  ws.onopen = () => {
    console.log('ws open');
    ws.send(
      JSON.stringify({
        playerName: Store.playerName,
        gameId: Store.game._id,
        command: 'player_join',
        value: null,
      })
    );
  };

  ws.onerror = (error) => {
    displayMessage(false, 'Server closed connection');
    console.log('errror:', error);
  };

  ws.onclose = () => {
    console.log('connection cloed');
  };

  ws.onmessage = (message) => {
    messageHandler(JSON.parse(message.data));
  };
};

const sendMessage = (command, value) => {
  console.log('sending msg', command, value);
  const msgObject = {
    playerName: Store.playerName,
    gameId: Store.game._id,
    command,
    value,
  };
  ws.send(JSON.stringify(msgObject));
};

const closeConnection = () => {
  ws.close();
  console.log('connection closed');
};

export { closeConnection, sendMessage, initWs };
