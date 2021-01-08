import { sendData } from '../api.js';
// import { switchPage } from '../index.js'
import Store from '../store.js';
import { displayMessage, closeMessage } from '../components/message.js';

const tooglePassword = () => {
  document.getElementById('passwordNewRow').hidden = !document.getElementById(
    'passwordProtection'
  ).checked;
};

const createGame = async () => {
  closeMessage();
  const gameName = document.getElementById('gameNameNew').value;
  const description = document.getElementById('descriptionNew').value;
  const rounds = document.getElementById('roundsNew').value;
  const timer = document.getElementById('timerNew').value;
  const wordsCount = document.getElementById('wordsCountNew').value;
  const passwordEl = document.getElementById('passwordNew');
  const passwordRepeatEl = document.getElementById('passwordRepeatNew');
  const adminName = document.getElementById('adminNameNew').value;

  if (passwordEl.value !== passwordRepeatEl.value) {
    passwordEl.classList.add('is-invalid');
    passwordRepeatEl.classList.add('is-invalid');
    displayMessage(false, 'Passwords not the same');
    return;
  }

  // Remove invalid styling
  if (passwordEl.classList.contains('is-invalid')) {
    passwordEl.classList.remove('is-invalid');
    passwordRepeatEl.classList.remove('is-invalid');
  }

  const result = await sendData('/game', 'POST', {
    gameName,
    description,
    rounds,
    timer,
    wordsCount,
    password: passwordEl.value,
    adminName,
  });
  if (result.status === true) {
    document.getElementById(
      'gameUrlNew'
    ).value = `${window.location.origin}/${result.gameId}`;
    document.getElementById('copyUrlNew').onclick = function () {
      document.getElementById('gameUrlNew').select();
      document.execCommand('copy');
    };
    document.getElementById('urlBox').hidden = false;
  } else {
    displayMessage(result.status, 'Could not create project');
  }
};
const init = async () => {
  document.title = `TopfGame - Create new Game`;
  document.getElementById('createGameButton').onclick = createGame;
  document.getElementById('passwordProtection').onclick = tooglePassword;
  Store.homePage.hidden = false;
};

const close = () => {
  Store.homePage.hidden = true;
};

export default init;
