import { sendData } from '../api.js'
// import { switchPage } from '../index.js'
import Store from '../store.js'
import { displayMessage } from '../components/message.js'

const init = async () => {
  document.title = `TopfGame - Create new Game`
  createGameButton.onclick = createGame
  passwordProtection.onclick = () => tooglePassword()
  Store.homePage.hidden = false
}

const close = () => {
  Store.homePage.hidden = true
}

const tooglePassword = () => {
  passwordNewRow.hidden = !passwordProtection.checked
}

const createGame = async () => {
  const name = document.getElementById('gameNameNew').value
  const description = document.getElementById('descriptionNew').value
  const rounds = document.getElementById('roundsNew').value
  const timer = document.getElementById('timerNew').value
  const passwordEl = document.getElementById('passwordNew')
  const passwordRepeatEl = document.getElementById('passwordRepeatNew')

  if (passwordEl.value !== passwordRepeatEl.value) {
    passwordEl.classList.add('is-invalid')
    passwordRepeatEl.classList.add('is-invalid')
    displayMessage(false, 'Passwords not the same')
    return
  }

  // Remove invalid styling
  if (passwordEl.classList.contains('is-invalid')) {
    passwordEl.classList.remove('is-invalid')
    passwordRepeatEl.classList.remove('is-invalid')
  }

  const result = await sendData('/projects', 'POST', {
    name,
    description,
    folderPath,
    password: passwordEl.value,
  })
  if (result.status === true) {
    document.getElementById('nameNew').value = ''
    document.getElementById('descriptionNew').value = ''
    document.getElementById('passwordNew').value = ''
    document.getElementById('passwordRepeatNew').value = ''
    document.getElementById('folderPathNew').value = ''
    init()
    displayMessage(result.status, 'Project successfully created')
  } else {
    displayMessage(result.status, 'Could not create project')
  }
}

export { init }
