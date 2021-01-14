import Store from './store.js';
import homeInit from './pages/home.js';
import { init as gameInit } from './pages/game.js';
import { closeMessage, displayMessage } from './components/message.js';

const route = async () => {
  const currentRoute = window.location.pathname;
  if (currentRoute === '/') {
    homeInit();
  } else {
    gameInit();
  }
};

const init = () => {
  route();
};

init();
