import Store from './store.js'
import * as home from './pages/home.js'
import * as game from './pages/game.js'
import { closeMessage, displayMessage } from './components/message.js'

const init = () => {
  console.log('init')
  route()
}

const route = async () => {
  const route = window.location.pathname
  if (route === '/') {
    home.init()
  } else {
    if (checkIfPassword(route)) {
      return
    }
    game.init()
  }
}

const checkIfPassword = (goUrl) => {
  if (Store.password === '') {
    passwordFuncs.init(goUrl)
    return true
  }
  return false
}

init()
