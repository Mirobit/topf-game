import { sendData } from '../api.js';
import { closeConnection, sendMessage, initWs } from '../socket.js';
import Store from '../store.js';
import {
  displayNotification,
  closeNotification,
} from '../components/notification.js';

let gameId;

const drawPlayerList = () => {
  const playerListParentDiv = document.getElementById('playerList');
  Store.game.players.forEach((player) => {
    let activityTag = '';
    switch (player.activity) {
      case 'none':
        break;
      case 'guessing':
        activityTag = '[G] ';
        break;
      case 'explaining':
        activityTag = '[E] ';
        break;
      default:
        break;
    }
    const playerDiv = playerListParentDiv.appendChild(
      document.createElement('div')
    );
    playerDiv.classList = 'player-list-entry';
    playerDiv.id = `playerListEntry-${player.name}`;
    playerDiv.innerText = `${activityTag}${player.name}: ${player.status}`;
  });
};

const checkPlayersReady = () => {
  let ready = true;
  Store.game.players.forEach((player) => {
    if (player.status === 'new' || player.status === 'submitted') ready = false;
  });

  return ready;
};

const checkIsAdmin = (token) =>
  JSON.parse(atob(token.split('.')[1])).role === 'admin';

const updatePlayerStatus = ({ playerName, newStatus, activity }) => {
  const playerUpdated = Store.game.players.find(
    (player) => player.name === playerName
  );
  let activityTag = '';
  switch (activity) {
    case 'none':
      break;
    case 'guessing':
      activityTag = '[G] ';
      break;
    case 'explaining':
      activityTag = '[E] ';
      break;
    default:
      break;
  }
  if (!playerUpdated) {
    const playerDiv = document
      .getElementById('playerList')
      .appendChild(document.createElement('div'));
    playerDiv.classList = 'player-list-entry';
    playerDiv.id = `playerListEntry-${playerName}`;
    playerDiv.innerText = `${activityTag}${playerName}: ${newStatus}`;

    Store.game.players.push({ name: playerName, status: newStatus });
  } else {
    playerUpdated.status = newStatus;
    playerUpdated.activity = activity;
    document.getElementById(
      `playerListEntry-${playerName}`
    ).innerText = `${activityTag}${playerName}: ${newStatus}`;
  }
  if (Store.player.isAdmin) {
    document.getElementById('startGame').disabled = !checkPlayersReady();
  }
};

const updatePlayerList = (data) => {
  Store.game.players = data.players;
  drawPlayerList();
};

const updateGameInfo = () => {
  console.log(Store);
  Store.timeLeftNode.innerText = Store.game.timer;
  Store.totalRoundsNode.innerText = Store.game.totalRounds;
  Store.currentRoundNode.innerText = Store.game.currentRound;
  Store.currentPointsNode.innerText = Store.player.currentPoints;
  Store.totalPointsNode.innerText = Store.player.totalPoints;
};

const gameStart = () => {
  const endSound = document.getElementById('endSound');
  endSound.volume = 1; // 1 -> 100%
  let timeLeft = Store.game.timer;
  const timeLeftInt = setInterval(() => {
    timeLeft--;
    if (timeLeft === 0) {
      clearInterval(timeLeftInt);
      Store.timeLeftNode.innerText = 'Over!';
      endSound.play();
    } else {
      Store.timeLeftNode.innerText = timeLeft;
    }
  }, 1000);
};

const setGameWords = (data) => {
  Store.game.words = data.words;
};

const gameStartCountdown = () => {
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

const initGame = (data) => {
  document.getElementById('wordSuggetionsArea').visibility = 'hidden';
  gameStartCountdown();
};

const gameMessageHandler = (message) => {
  switch (message.command) {
    case 'player_status':
      updatePlayerStatus(message.payload);
      break;
    case 'player_joined':
      updatePlayerStatus(message.payload);
      break;
    case 'game_words':
      setGameWords(message.payload);
      break;
    case 'game_start':
      initGame(message.payload);
      break;
    case 'game_player_list':
      updatePlayerList(message.payload);
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
  closeNotification();
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
      displayNotification(
        false,
        `All ${Store.game.wordsCount} words must be unqiue`
      );
      return;
    }

    if (words[i] === '') {
      displayNotification(
        false,
        `Please enter all ${Store.game.wordsCount} words`
      );
      return;
    }
  }

  sendMessage('player_words_submitted', { words });
  document.getElementById('submitWords').disabled = true;
  document.getElementById('setReady').disabled = false;
  displayNotification(
    true,
    `Words succesfully submitted. You can now signal that you are ready!`
  );
};

const handleStartGame = () => {
  closeNotification();
  sendMessage('game_start', true);
};

const initGameLobby = async (game) => {
  closeNotification();
  Store.game = game;
  document.title = `TopfGame - ${game.name}`;

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

  // Admin only
  if (Store.player.isAdmin) {
    document.getElementById('startGame').hidden = false;
    document.getElementById('startGame').onclick = handleStartGame;
  }

  // Set game board
  updateGameInfo();

  // Set event handlers
  document.getElementById('setReady').onclick = handleSetReady;
  document.getElementById('submitWords').onclick = handleSubmitWords;

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
  if (result.status === 200) {
    localStorage.setItem('identity', result.data.token);
    Store.game = result.data.game;
    Store.player.name = playerName;
    Store.player.isAdmin = checkIsAdmin(result.data.token);
    initGameLobby(result.data.game);
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
