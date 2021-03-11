import { sendData, getData } from '../api.js';
import { closeConnection, sendMessage, initWs } from '../socket.js';
import Store from '../store.js';
import {
  displayNotification,
  closeNotification,
} from '../components/notification.js';

const COUNTDOWN_SECONDS = 5;

const checkPlayersReady = () => {
  let ready = true;
  Store.game.players.forEach((player) => {
    if (player.status === 'unready' || player.status === 'disconnected')
      ready = false;
  });

  return ready;
};

const removePlayer = (playerName) => {
  sendMessage('game_remove_player', {
    playerName,
  });
  closeNotification();
  document.getElementById('startGame').disabled = !checkPlayersReady();
};

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

    const playerRoleEl = playerDiv.appendChild(document.createElement('i'));
    if (player.activity === 'explaining') {
      playerRoleEl.classList = 'player-activity fa fa-comment-o';
      playerRoleEl.title = 'Explaining';
    } else if (player.activity === 'guessing') {
      playerRoleEl.classList = 'player-activity fa fa-gamepad';
      playerRoleEl.title = 'Guessing';
    } else {
      playerRoleEl.classList = 'player-activity fa fa-tv';
      playerRoleEl.title = 'Watching';
    }
    playerRoleEl.setAttribute('aria-hidden', 'true');

    const playerNameEl = playerDiv.appendChild(document.createElement('span'));
    playerNameEl.classList = 'player-name';
    playerNameEl.innerText = player.name;

    const playerScoreEl = playerDiv.appendChild(document.createElement('span'));
    playerScoreEl.classList = 'player-score';
    playerScoreEl.innerText = player.score;

    const playerStatusEl = playerDiv.appendChild(document.createElement('i'));
    if (player.status === 'ready') {
      playerStatusEl.classList = 'player-status cl-success fa fa-check';
      playerStatusEl.title = 'Player is ready';
    } else if (player.status === 'unready') {
      playerStatusEl.classList = 'player-status fa fa-hourglass-o';
      playerStatusEl.title = 'Player not ready';
    } else if (player.status === 'quit') {
      playerStatusEl.classList = 'player-status fa fa-sign-out';
      playerStatusEl.title = 'Player left';
    } else if (player.status === 'disconnected') {
      playerStatusEl.classList = 'player-status cl-warning fa fa-question';
      playerStatusEl.title = 'Connection lost';
      if (Store.player.isAdmin) {
        const removePlayerEl = playerDiv.appendChild(
          document.createElement('i')
        );
        removePlayerEl.classList = 'cl-error fa fa-times clickable';
        removePlayerEl.title = 'Remove player from game';
        removePlayerEl.setAttribute('aria-hidden', 'true');
        removePlayerEl.onclick = () => removePlayer(player.name);
        displayNotification(
          false,
          `Connection to player <i>${player.name}</i> was lost. Please remove the player or wait for <i>${player.name}</i> to rejoin before continuing the game.`
        );
        document.getElementById('startGame').disabled = true;
      }
    } else playerStatusEl.classList = 'player-status';
    playerStatusEl.setAttribute('aria-hidden', 'true');
  });
  console.timeEnd('playerlist');
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

const updatePlayerStore = ({ hasSubmittedWords, score, activity }) => {
  document.getElementById('wordSuggetionsArea').hidden = hasSubmittedWords;
  document.getElementById('setReady').disabled = !hasSubmittedWords;
  Store.setGameMessage(`You rejoined the game`);
  Store.player.hasSubmittedWords = hasSubmittedWords;
  Store.player.totalPoints = score;
  Store.player.activity = activity;
};

const updateResultsLastTurn = ({ points, playerName, roundNo, timeLeft }) => {
  Store.syncTimeLeft(timeLeft);
  if (timeLeft === 0) {
    Store.setGameMessage(
      `${playerName} guessed ${points} ${points > 1 ? 'words' : 'word'}`
    );
  } else {
    Store.setGameMessage(
      `${playerName} guessed ${points} ${
        points > 1 ? 'words' : 'word'
      } and finished the ${roundNo}. round`
    );
  }
  if (Store.player.isAdmin) {
    document.getElementById('startGame').disabled = false;
  }
};

const setPlayerList = (data) => {
  Store.game.players = data.players;
  drawPlayerList();
};

const updateGameInfo = () => {
  Store.timeLeftNode.innerText = Store.game.timer;
  Store.totalRoundsNode.innerText = Store.game.totalRounds;
  Store.currentRoundNode.innerText = Store.game.currentRound;
  Store.currentPointsNode.innerText = Store.player.currentPoints;
};

const turnFinish = () => {
  clearInterval(Store.timeLeftInt);
  const endSound = document.getElementById('endSound');
  endSound.volume = 1; // 1 -> 100%
  endSound.play();
  if (Store.player.activity === 'explaining') {
    sendMessage('game_turn_finished', {
      words: Store.game.words,
      timeLeft: Store.game.timeLeft,
    });
    document.getElementById('wordArea').hidden = true;
  }
  Store.player.activity = 'none';
  Store.game.curWordIndex = 0;
};

const turnStart = () => {
  if (Store.player.activity === 'explaining') {
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

const setGameExplain = ({ words }) => {
  Store.player.activity = 'explaining';
  console.log('setting player activity', Store.player.activity);
  Store.game.words = words;
};

const setGameGuess = () => {
  Store.player.activity = 'guessing';
};

const gameStartCountdown = () => {
  console.log(Store.player.activity);
  let gameMessage;
  let countdownSecs = COUNTDOWN_SECONDS;

  if (Store.player.activity === 'explaining')
    gameMessage = `Explaining in ${countdownSecs}`;
  else if (Store.player.activity === 'guessing')
    gameMessage = `Guessing in ${countdownSecs}`;
  else gameMessage = `${countdownSecs}`;

  Store.setGameMessage(gameMessage);

  const countdownInt = setInterval(() => {
    countdownSecs--;
    if (countdownSecs === 0) {
      if (Store.player.activity === 'explaining')
        gameMessage = 'You can start explaining';
      else if (Store.player.activity === 'guessing')
        gameMessage = 'You can start guessing';
      else gameMessage = 'Turn started';

      Store.setGameMessage(gameMessage);
      clearInterval(countdownInt);
      turnStart();
    } else {
      if (Store.player.activity === 'explaining')
        gameMessage = `Explaining in ${countdownSecs}`;
      else if (Store.player.activity === 'guessing')
        gameMessage = `Guessing in ${countdownSecs}`;
      else gameMessage = `${countdownSecs}`;

      Store.setGameMessage(gameMessage);
    }
  }, 1000);
};

const setNextRound = ({ roundNo }) => {
  Store.setCurrentRound(roundNo);
  document.getElementById('startGame').innerText = 'Next Round';
};

const setGameFinished = ({ winner, score }) => {
  let gameMessage = `${winner} won the game with ${score} points!`;
  if (winner === Store.player.name) {
    globalThis.confetti.speed = 1;
    globalThis.confetti.start(6000);
    gameMessage = `You won the game with ${score} points!`;
  }
  Store.setGameMessage(gameMessage);
  document.getElementById('startGame').hidden = true;
};

const initGame = () => {
  document.getElementById('wordSuggetionsArea').hidden = true;
  gameStartCountdown();
};

const gameMessageHandler = (message) => {
  console.log('message', message);
  if (message)
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
      case 'player_store_update':
        updatePlayerStore(message.payload);
        break;
      case 'game_set_explain':
        setGameExplain(message.payload);
        break;
      case 'game_set_guess':
        setGameGuess(message.payload);
        break;
      case 'game_next_round':
        setNextRound(message.payload);
        break;
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

const handleShuffelPlayers = () => {
  document.getElementById('shuffelPlayers').classList.add('fa-spin');
  sendMessage('game_shuffel_players', true);
  setTimeout(() => {
    document.getElementById('shuffelPlayers').classList.remove('fa-spin');
  }, 500);
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
  Store.setGameMessage('Waiting for the game to start...');
  document.getElementById('submitWords').hidden = true;
  document.getElementById('setReady').disabled = false;
  displayNotification(
    true,
    `Words succesfully submitted. You can now signal that you are ready!`
  );
  wordNodes.forEach((wordNode) => {
    wordNode.disabled = true;
  });
};

const handleStartGame = () => {
  closeNotification();
  document.getElementById('shuffelPlayers').hidden = true;
  document.getElementById('startGame').disabled = true;
  document.getElementById('startGame').innerText = 'Next Turn';
  sendMessage('game_turn_start', true);
};

const initGameLobby = async () => {
  closeNotification();
  document.title = `TopfGame - ${Store.game.name}`;

  // Create forms
  const wordsParentDiv = document.getElementById('wordSuggetions');
  for (let i = 0; i < Store.game.wordsCount; i++) {
    const wordSuggetion = wordsParentDiv.appendChild(
      document.createElement('input')
    );
    wordSuggetion.type = 'text';
    wordSuggetion.classList =
      'form-control-alternative form-control word-suggestion-input input';
    wordSuggetion.placeholder = ` ${i + 1}. Word`;
    wordSuggetion.maxlength = 50;
    wordSuggetion.id = `wordSuggestion${i + 1}`;
    wordSuggetion['aria-describedby'] = `wordSuggestionHelp${1 + 1}`;
  }

  // Admin only
  if (Store.player.isAdmin) {
    document.getElementById('startGame').hidden = false;
    document.getElementById('startGame').onclick = handleStartGame;
    document.getElementById('shuffelPlayers').hidden = false;
    document.getElementById('shuffelPlayers').onclick = handleShuffelPlayers;
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

const parseJWT = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

const joinGame = async (playerName, gamePassword, token = null) => {
  const result = await sendData('/game/join', 'POST', {
    gameId: Store.game.id,
    playerName,
    gamePassword,
    token,
  });

  if (result.status === 200) {
    Store.game = result.data.game;
    Store.player.name = playerName;
    Store.token = result.data.token;
    Store.player.isAdmin = checkIsAdmin(Store.token);

    initGameLobby();
    initWs(gameMessageHandler);
    localStorage.setItem(Store.game.id, result.data.token);
  } else {
    displayNotification(false, result.message);
  }
};

const handleJoinGame = async () => {
  const playerName = document.getElementById('loginPlayerName').value;
  const gamePassword = document.getElementById('loginGamePassword').value;

  joinGame(playerName, gamePassword);
};

const init = async () => {
  Store.game.id = window.location.pathname.replace('/', '');
  const token = localStorage.getItem(Store.game.id);

  if (token) {
    const jwtPayload = parseJWT(token);
    if (jwtPayload === null) {
      displayNotification(
        false,
        'Invalid player token. Please delete your local browser storage'
      );
      return;
    }
    joinGame(jwtPayload.playerName, '', token);
  } else {
    const { payload: game } = await getData(`/game/${Store.game.id}`);
    document.title = `TopfGame - Join: ${game.name}`;
    if (game.hasPassword) {
      document.getElementById('loginPassword').hidden = false;
    }
    document.getElementById('joinGameButton').onclick = handleJoinGame;
    document.getElementById('joinGameForm').hidden = false;
  }
};

const close = () => {
  Store.gamePage.hidden = true;
};

export { init };
