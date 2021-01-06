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

const updatePlayerStatus = (data) => {
  const playerUpdated = Store.game.players.find(
    (player) => player.name === data.playerName
  );
  playerUpdated.status = data.status;
  document.getElementById(
    `playerListEntry-${data.playerName}`
  ).innerText = `${data.playerName}: ${data.status}`;
};

const gameStart = (data) => {
  //
};

const gameMessageHandler = (message) => {
  switch (message.command) {
    case 'player_status':
      updatePlayerStatus(message.value);
      break;
    case 'player_join':
      updatePlayerStatus(message.value);
      break;
    case 'game_start':
      gameStart(message.value);
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
  const status = event.target.checked ? 'ready' : 'new';
  sendMessage('player_status', status);
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

  sendMessage('submit_words', words);
  // document.getElementById('submitWords').disabled = true;
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
  if (result.status === true) {
    Store.playerName = playerName;
    initGame(result.game);
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
