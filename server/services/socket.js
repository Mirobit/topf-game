const WebSocket = require('ws')

const channels = new Map()

const addPlayer = (ws) => {
  //
}

const removePlayer = (ws) => {
  //
}

const startGame = (gameId) => {
  //
}

const endGame = (gameId) => {
  //
}

const nextRound = (gameId) => {
  //
}

const createChannel = () => {
  //
}

const init = (server) => {
  var wss = new WebSocket.Server({ server })

  wss.on('connection', (ws) => {
    console.log('new connection')
    ws.on('message', (message) => {
      console.log(message)
    })
  })

  wss.on('message', (message) => {
    console.log('asd', message)
  })

  return wss
}

module.exports = init
