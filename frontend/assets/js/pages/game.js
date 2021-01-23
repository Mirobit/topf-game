import { sendData } from '../api.js';
import { closeConnection, sendMessage, initWs } from '../socket.js';
import Store from '../store.js';
import {
  displayNotification,
  closeNotification,
} from '../components/notification.js';

const COUNTDOWN_SECONDS = 5;

const drawPlayerList = () => {
  console.time('playerlist');
  const playerListParentDiv = document.getElementById('playerList');
  playerListParentDiv.innerHTML = '';
  Store.game.players.forEach((player) => {
    const playerDiv = playerListParentDiv.appendChild(
      document.createElement('div')
    );
    playerDiv.classList = 'player-list-entry';
    playerDiv.id = `playerListEntry-${player.name}`;

    console.log(player);
    const playerRoleEl = playerDiv.appendChild(document.createElement('i'));
    if (player.activity === 'explaining')
      playerRoleEl.classList = 'player-activity fa fa-comment-o';
    else if (player.activity === 'guessing')
      playerRoleEl.classList = 'player-activity fa fa-gamepad';
    else {
      playerRoleEl.classList = 'player-activity fa fa-tv';
    }
    playerRoleEl.setAttribute('aria-hidden', 'true');

    const playerNameEl = playerDiv.appendChild(document.createElement('span'));
    playerNameEl.classList = 'player-name';
    playerNameEl.innerText = player.name;

    const playerScoreEl = playerDiv.appendChild(document.createElement('span'));
    playerScoreEl.classList = 'player-score';
    playerScoreEl.innerText = player.score;

    const playerStatusEl = playerDiv.appendChild(document.createElement('i'));
    if (player.status === 'ready')
      playerStatusEl.classList = 'player-status cl-success fa fa-check';
    // else if (player.status === 'unready')
    //   playerStatusEl.classList = 'player-status fa fa-hourglass-start';
    else if (player.status === 'quit')
      playerStatusEl.classList = 'player-status fa fa-sign-out';
    else if (player.status === 'disconnected')
      playerStatusEl.classList = 'player-status cl-warning fa fa-question';
    else playerStatusEl.classList = 'player-status';
    playerStatusEl.setAttribute('aria-hidden', 'true');
  });
  console.timeEnd('playerlist');
};

const checkPlayersReady = () => {
  let ready = true;
  Store.game.players.forEach((player) => {
    if (player.status === 'unready' || player.status === 'submitted')
      ready = false;
  });

  return ready;
};

const checkIsAdmin = (token) =>
  JSON.parse(atob(token.split('.')[1])).role === 'admin';

const updatePlayerStatus = ({ playerName, newStatus, activity, score }) => {
  const playerUpdated = Store.game.players.find(
    (player) => player.name === playerName
  );

  if (!playerUpdated) {
    Store.game.players.push({
      name: playerName,
      status: newStatus,
      activity,
      score,
    });
  } else {
    playerUpdated.status = newStatus;
  }

  drawPlayerList();

  if (Store.player.isAdmin) {
    document.getElementById('startGame').disabled = !checkPlayersReady();
  }
};

const updateResultsLastTurn = ({ timeLeft }) => {
  console.log('timeleft!!!', timeLeft);
  Store.syncTimeLeft(timeLeft);
  if (Store.player.isAdmin) {
    document.getElementById('startGame').disabled = false;
  }
  console.log('timeleft!!! afer', Store.game.timeLeft);
};

const setPlayerList = (data) => {
  Store.game.players = data.players;
  drawPlayerList();
};

const updateGameInfo = () => {
  console.log('updating game info');
  Store.timeLeftNode.innerText = Store.game.timer;
  Store.totalRoundsNode.innerText = Store.game.totalRounds;
  Store.currentRoundNode.innerText = Store.game.currentRound;
  Store.currentPointsNode.innerText = Store.player.currentPoints;
  Store.totalPointsNode.innerText = Store.player.totalPoints;
};

const turnFinish = () => {
  clearInterval(Store.timeLeftInt);
  const endSound = document.getElementById('endSound');
  endSound.volume = 1; // 1 -> 100%
  endSound.play();
  Store.gameMessageNode.innerText = 'Over!';
  if (Store.player.activity === 'explaining') {
    sendMessage('game_turn_finished', {
      words: Store.game.words,
      timeLeft: Store.game.timeLeft,
    });
    document.getElementById('wordArea').hidden = true;
    Store.player.activity = 'none';
  }
  Store.game.curWordIndex = 0;
};

const turnStart = () => {
  if (Store.player.activity === 'explaining') {
    console.log('explaining', Store.game.words[0].string);
    Store.currentWordNode.innerText = Store.game.words[0].string;
    document.getElementById('wordArea').hidden = false;
  } else {
    console.log('not explaing', Store.player);
  }
  console.log('Store timer', Store.game.timeLeft);
  Store.game.timeLeft = Store.game.timeLeft || Store.game.timer;
  console.log('Printed timer', Store.game.timeLeft);
  Store.timeLeftInt = setInterval(() => {
    Store.game.timeLeft--;
    Store.timeLeftNode.innerText = Store.game.timeLeft;
    if (Store.game.timeLeft === 0) {
      turnFinish();
    }
  }, 1000);
};

const setGameWords = ({ words }) => {
  Store.player.activity = 'explaining';
  Store.game.words = words;
};

const gameStartCountdown = () => {
  let countdownSecs = COUNTDOWN_SECONDS;
  Store.gameMessageNode.innerText = `Get ready: ${countdownSecs}`;
  const countdownInt = setInterval(() => {
    countdownSecs--;
    if (countdownSecs === 0) {
      Store.gameMessageNode.innerText =
        Store.player.activity !== 'none' ? 'Go!' : '';
      clearInterval(countdownInt);
      turnStart();
    } else {
      Store.gameMessageNode.innerText = `Get ready: ${countdownSecs}`;
    }
  }, 1000);
};

// const setTurnFinished = ({ timeLeft }) => {
//   clearInterval(Store.timeLeftInt);
//   Store.game.timeLeft = timeLeft;
// };

const setNextRound = ({ roundNo }) => {
  Store.setCurrentRound(roundNo);
};

const setGameFinished = ({ winner, score }) => {
  Store.gameMessageNode.innerText = `${winner} won with ${score} points!`;
  if (winner === Store.player.name) {
    globalThis.confetti.speed = 1;
    globalThis.confetti.start(6000);
  }
};

const initGame = () => {
  document.getElementById('wordSuggetionsArea').style.visibility = 'hidden';
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
    case 'player_words_guessed':
      updateResultsLastTurn(message.payload);
      break;
    case 'game_words':
      setGameWords(message.payload);
      break;
    case 'game_next_round':
      setNextRound(message.payload);
      break;
    // case 'game_turn_finished':
    //   setTurnFinished(message.payload);
    //   break;
    case 'game_turn_start':
      initGame();
      break;
    case 'game_player_list':
      setPlayerList(message.payload);
      break;
    case 'game_finished':
      setGameFinished(message.payload);
      break;
    default:
      console.log('unknown command', message);
  }
};

const handlePayerLeft = () => {
  closeConnection();
  // TODO show player different page
};

const handleNextWord = (guessed) => {
  Store.game.words[Store.game.curWordIndex].guessed = guessed;
  if (Store.game.curWordIndex === Store.game.words.length - 1) {
    turnFinish();
    return;
  }
  Store.game.curWordIndex++;
  Store.currentWordNode.innerText =
    Store.game.words[Store.game.curWordIndex].string;
};

const handleSetReady = (event) => {
  closeNotification();
  const newStatus = event.target.checked ? 'ready' : 'unready';
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
  document.getElementById('startGame').disabled = true;
  document.getElementById('startGame').innerText = 'Next';
  sendMessage('game_turn_start', true);
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
  document.getElementById('wordGuessed').onclick = () => handleNextWord(true);
  document.getElementById('wordSkipped').onclick = () => handleNextWord(false);

  // Set pages visibilty
  document.getElementById('startGameSection').hidden = false;
  document.getElementById('joinGameForm').hidden = true;
  Store.gamePage.hidden = false;
};

const joinGame = async () => {
  const playerName = document.getElementById('playerNameNew').value;
  const gamePassword = document.getElementById('gamePassword').value;

  const result = await sendData('/game/join', 'POST', {
    gameId: Store.game.id,
    playerName,
    gamePassword,
  });
  console.log(result);
  if (result.status === 200) {
    localStorage.setItem(Store.game.id, result.data.token);
    Store.game = result.data.game;
    Store.player.name = playerName;
    Store.player.isAdmin = checkIsAdmin(result.data.token);
    initGameLobby(result.data.game);
  }
};

const init = async () => {
  Store.game.id = window.location.pathname.replace('/', '');
  document.title = `TopfGame - Join Game`;
  document.getElementById('joinGameButton').onclick = joinGame;
  document.getElementById('joinGameForm').hidden = false;
};

const close = () => {
  Store.gamePage.hidden = true;
};

export { init };
