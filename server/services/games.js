const Game = require('../models/Game')
const { hash } = require('../utils/crypter')

const get = async (id) => {
  try {
    const game = await Game.findOneById(id)
    return game
  } catch (error) {
    throw new Error(error.message)
  }
}

const list = async () => {
  try {
    const games = await Game.find({}, null, { sort: { created_at: -1 } })
    return games
  } catch (error) {
    throw new Error(error.message)
  }
}

const create = async (data) => {
  try {
    console.log(data)
    const game = await new Game(data)
    if (data.password) game.password = hash(data.password)
    await game.save()
    return game._id
  } catch (error) {
    throw new Error(error.message)
  }
}

const update = async (id, data) => {
  try {
    await Game.findOneAndUpdate({ _id: id }, data, {
      new: true,
      runValidators: true,
    })
    return
  } catch (error) {
    throw new Error(error.message)
  }
}

const remove = async (id) => {
  try {
    await Game.findOneAndDelete({ _id: id })
    return
  } catch (error) {
    throw new Error(error.message)
  }
}

const startGame = async (gameId) => {
  try {
    const game = await Game.findById(gameId)
    setPlayOrder(game)
    game.status = 'started'
    await game.save()
    return game.playOrder
  } catch (error) {
    throw new Error(error.message)
  }
}

const setPlayOrder = async (game) => {
  const players = JSON.parse(JSON.stringify(game.players))
  let count = players.length
  while (count > 0) {
    const ranNumber = getRandomNumber(count)
    game.playOrder.push(players[ranNumber].name)
    player.splice(ranNumber, 1)
    count--
  }
}

function getRandomNumber(max) {
  return Math.floor(Math.random() * max)
}

const join = async (gameId, playerName, gamePassword) => {
  try {
    const game = await Game.findById(gameId)

    if (game.password && hash(gamePassword) !== game.password) {
      throw { name: 'Custom', message: 'Invalid game password' }
    }
    if (
      game.players.some(
        (player) => player.name.toUpperCase() === playerName.toUpperCase()
      )
    ) {
      throw { name: 'Custom', message: 'Player name already in use' }
    }
    game.players.push({ name: playerName })
    await game.save()
    delete game.password

    return game
  } catch (error) {
    throw { name: error.name, message: error.message, stack: error.stack }
  }
}

const updatePlayerStatus = async (gameId, playerName, playerStatus) => {
  try {
    const game = await Game.findOneAndUpdate(
      { _id: gameId, 'categories.name': playerName },
      {
        $set: {
          'categories.$.name': data.name,
          'categories.$.status': playerStatus,
        },
      },
      { runValidators: true, new: true }
    )

    return game
  } catch (error) {
    throw new Error(error.message)
  }
}

const removePlayer = async (gameId, playerName) => {
  try {
    const game = await Game.findOneAndUpdate(
      { _id: gameId },
      { $pull: { players: { name: playerName } } }
    )
    return game
  } catch (error) {
    throw new Error(error.message)
  }
}

module.exports = {
  get,
  list,
  create,
  update,
  remove,
  startGame,
  join,
  updatePlayerStatus,
  removePlayer,
}
