import { sendData } from '../api.js';
import { closeConnection, sendMessage, initWs } from '../socket.js';
import Store from '../store.js';
import { displayMessage, closeMessage } from '../components/message.js';

let gameId;

const drawPlayerList = () => {
  const playerListParentDiv = document.getElementById('playerList');
  Store.game.players.forEach((player) => {
    const playerDiv = playerListParentDiv.appendChild(
      document.createElement('div')
    );
    playerDiv.classList = 'player-list-entry';
    playerDiv.id = `playerListEntry-${player.name}`;
    playerDiv.innerText = `${player.name}: ${player.status}`;
  });
};

const updatePlayerStatus = ({ playerName, newStatus }) => {
  const playerUpdated = Store.game.players.find(
    (player) => player.name === playerName
  );
  if (!playerUpdated) {
    const playerDiv = document
      .getElementById('playerList')
      .appendChild(document.createElement('div'));
    playerDiv.classList = 'player-list-entry';
    playerDiv.id = `playerListEntry-${playerName}`;
    playerDiv.innerText = `${playerName}: ${newStatus}`;

    Store.game.players.push({ playerName, status: newStatus });
  } else {
    playerUpdated.status = newStatus;
    document.getElementById(
      `playerListEntry-${playerName}`
    ).innerText = `${playerName}: ${newStatus}`;
  }
};

const gameStart = () => {
  const timeLeftDiv = document.getElementById('timeLeft');
  const endSound = document.getElementById('endSound');
  endSound.volume = 1; // 1 -> 100%
  let timeLeft = Store.game.timer;
  const timeLeftInt = setInterval(() => {
    timeLeft--;

    if (timeLeft === 0) {
      clearInterval(timeLeftInt);
      timeLeftDiv.innerText = 'Over!';
      endSound.play();
    } else {
      timeLeftDiv.innerText = timeLeft;
    }
  }, 1000);
};

const gameStartCountdown = (data) => {
  const countdownDiv = document.getElementById('gameCountdown');
  document.getElementById('timeLeft').innerText = Store.game.timer;
  let countdownSecs = 5;
  countdownDiv.innerText = countdownSecs;
  const countdownInt = setInterval(() => {
    countdownSecs--;

    if (countdownSecs === 0) {
      clearInterval(countdownInt);
      countdownDiv.innerText = 'Go!';
      gameStart();
    } else {
      countdownDiv.innerText = countdownSecs;
    }
  }, 1000);
};

const gameMessageHandler = (message) => {
  switch (message.command) {
    case 'player_status':
      updatePlayerStatus(message.payload);
      break;
    case 'player_joined':
      updatePlayerStatus(message.payload);
      break;
    case 'game_start':
      gameStartCountdown(message.payload);
      break;
    default:
      console.log('unknown command', message);
  }
};

const handlePayerLeft = () => {
  closeConnection();
  // TODO show player different page
};

const handleSetReady = (event) => {
  const newStatus = event.target.checked ? 'ready' : 'new';
  sendMessage('player_status', { newStatus });
};

const handleSubmitWords = (event) => {
  const wordNodes = Array.from(
    document.getElementsByClassName('word-suggestion-input')
  );
  const words = [];
  // Check all words if not empty and unqiue and trim array to value
  for (let i = 0; i < Store.game.wordsCount; i++) {
    words[i] = wordNodes[i].value;
    if (i !== words.indexOf(words[i])) {
      displayMessage(
        false,
        `All ${Store.game.wordsCount} words must be unqiue`
      );
      return;
    }
    if (words[i] === '') {
      displayMessage(false, `Please enter all ${Store.game.wordsCount} words`);
      return;
    }
  }

  sendMessage('player_words_submitted', { words });
  document.getElementById('submitWords').disabled = true;
  document.getElementById('setReady').disabled = false;
  displayMessage(
    true,
    `Words succesfully submitted. You can now signal that you are ready!`
  );
};

const handleStartGame = () => {
  sendMessage('game_start', true);
};

const initGame = async (game) => {
  Store.game = game;
  document.title = `TopfGame - ${game.name}`;
  closeMessage();
  initWs(gameMessageHandler);
  // Create forms
  const wordsParentDiv = document.getElementById('wordSuggetions');
  for (let i = 0; i < Store.game.wordsCount; i++) {
    const wordSuggetion = wordsParentDiv.appendChild(
      document.createElement('input')
    );
    wordSuggetion.type = 'text';
    wordSuggetion.classList =
      'form-control-alternative form-control word-suggestion-input';
    wordSuggetion.placeholder = `Word ${i + 1}`;
    wordSuggetion.maxlength = 50;
    wordSuggetion.id = `wordSuggestion${i + 1}`;
    wordSuggetion['aria-describedby'] = `wordSuggestionHelp${1 + 1}`;
  }

  // Draw player list
  drawPlayerList();

  // Set event handlers
  document.getElementById('setReady').onclick = handleSetReady;
  document.getElementById('submitWords').onclick = handleSubmitWords;
  document.getElementById('startGame').onclick = handleStartGame;

  // Set pages visibilty
  document.getElementById('startGameSection').hidden = false;
  document.getElementById('joinGameForm').hidden = true;
  Store.gamePage.hidden = false;
};

const joinGame = async () => {
  const playerName = document.getElementById('playerNameNew').value;
  const gamePassword = document.getElementById('gamePassword').value;

  const result = await sendData('/game/join', 'POST', {
    gameId,
    playerName,
    gamePassword,
  });
  console.log(result);
  if (result.status === true) {
    localStorage.setItem('identity', result.data.token);
    Store.playerName = playerName;
    initGame(result.data.game);
  }
};

const init = async () => {
  gameId = window.location.pathname.replace('/', '');
  document.title = `TopfGame - Join Game`;
  document.getElementById('joinGameButton').onclick = joinGame;
  document.getElementById('joinGameForm').hidden = false;
};

const close = () => {
  Store.gamePage.hidden = true;
};

export { init };
