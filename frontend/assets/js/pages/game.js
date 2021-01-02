import { sendData } from '../api.js'
import { initWs } from '../socket.js'
import Store from '../store.js'
import { displayMessage, closeMessage } from '../components/message.js'

let gameId

const init = async () => {
  gameId = window.location.pathname.replace('/', '')
  document.title = `TopfGame - Join Game`
  document.getElementById('joinGameButton').onclick = joinGame
  document.getElementById('joinGameForm').hidden = false
}

const close = () => {
  Store.gamePage.hidden = true
}

const joinGame = async () => {
  const playerName = document.getElementById('playerNameNew').value
  const gamePassword = document.getElementById('gamePassword').value

  const result = await sendData('/game/join', 'POST', {
    gameId,
    playerName,
    gamePassword,
  })
  if (result.status === true) {
    initGame(result.game)
  }
}

const initGame = async (game) => {
  document.title = `TopfGame - ${game.name}`
  closeMessage()
  Store.game = game
  initWs()
  document.getElementById('joinGameForm').hidden = true
  Store.gamePage.hidden = false
}

export { init }
