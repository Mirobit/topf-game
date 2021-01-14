import Store from './store.js';
import homeInit from './pages/home.js';
import { init as gameInit } from './pages/game.js';
import {
  closeNotification,
  displayNotification,
} from './components/notification.js';

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
