import { displayNotification } from './components/notification.js';
import Store from './store.js';

let ws;
let messageHandler;
let token;

const initWs = (mH) => {
  messageHandler = mH;
  const baseUrl = window.location.host;
  const sProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
  const socketUrl = sProtocol + baseUrl;

  ws = new WebSocket(socketUrl);
  token = localStorage.getItem('identity');
  ws.onopen = () => {
    console.log('ws open');
    ws.send(
      JSON.stringify({
        playerName: Store.playerName,
        gameId: Store.game._id,
        command: 'player_joined',
        payload: { token },
      })
    );
  };

  ws.onerror = (error) => {
    displayNotification(false, 'Server closed connection');
    console.log('errror:', error);
  };

  ws.onclose = () => {
    console.log('connection cloed');
  };

  ws.onmessage = (message) => {
    console.log('receiving msg:', message.data);
    messageHandler(JSON.parse(message.data));
  };
};

const sendMessage = (command, payload) => {
  console.log('sending msg', command, payload);
  const msgObject = {
    playerName: Store.playerName,
    gameId: Store.game._id,
    command,
    payload,
  };
  ws.send(JSON.stringify(msgObject));
};

const closeConnection = () => {
  ws.close();
  console.log('connection closed');
};

export { closeConnection, sendMessage, initWs };
