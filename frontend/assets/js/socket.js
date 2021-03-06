import { displayNotification } from './components/notification.js';
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
    ws.send(
      JSON.stringify({
        playerName: Store.player.name,
        gameId: Store.game.id,
        command: 'player_joined',
        payload: { token: Store.token },
      })
    );
  };

  ws.onerror = (error) => {
    displayNotification(
      false,
      'Unexpected server error. Server closed connection'
    );
    console.log('errror:', error);
  };

  ws.onclose = () => {
    displayNotification(
      false,
      'Unexpected server error. Server closed connection'
    );
  };

  ws.onmessage = (message) => {
    console.log('receiving msg:', message.data);
    messageHandler(JSON.parse(message.data));
  };
};

const sendMessage = (command, payload) => {
  console.log('sending msg', command, payload);
  const msgObject = {
    playerName: Store.player.name,
    gameId: Store.game.id,
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
