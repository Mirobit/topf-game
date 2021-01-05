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
  console.log(Store);
  const msgObject = {
    player: Store.playerName,
    game: Store.game._id,
    command: null,
    value: null,
  };

  ws.onopen = () => {
    console.log('ws open');
    // displayMessage(true, 'connected to server')
    ws.send(JSON.stringify(msgObject));
    mH();
  };

  ws.onerror = (error) => {
    displayMessage(false, 'Server closed connection');
    console.log('errror:', error);
  };

  ws.onclose = () => {
    console.log('connection cloed');
  };

  ws.onmessage = (data) => {
    messageHandler(data);
  };
};

const sendMessage = (command, value) => {
  console.log('sending msg', command, value);
  const msgObject = {
    player: Store.playerName,
    game: Store.game._id,
    command,
    value,
  };
  ws.send(JSON.stringify(msgObject));
};

export { sendMessage, initWs };
