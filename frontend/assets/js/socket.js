import { closeMessage, displayMessage } from './components/message.js'

const baseUrl = window.location.host
const sProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://'
const socketUrl = sProtocol + baseUrl

const ws = new WebSocket(socketUrl)

ws.onopen = () => {
  console.log('ws open')
  displayMessage(true, 'connected to server')
  ws.send('hello server')
}

ws.onerror = (error) => {
  console.log('errror:', error)
}

ws.onclose = () => {
  console.log('connection cloed')
}

ws.onmessage = (data) => {
  console.log(data)
}
