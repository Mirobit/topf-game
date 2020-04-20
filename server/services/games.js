const Game = require('../../models/Game')
const { hash } = require('../../utils/crypter')

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
    await new Game(data)
    if (data.password) game.password = hash(data.password)
    await game.save()
    return
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

const checkPassword = async (gameId, password, gamePassword) => {
  if (gamePassword === undefined) {
    gamePassword = (await Game.findOneById(gameId).select('password')).password
  }
  return hash(password) === gamePassword
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
  players = JSON.parse(JSON.stringify(game.players))
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

const addPlayer = async (gameId, playerName) => {
  try {
    const game = await Game.findById(gameId)
    if (
      game.players.some(
        (player) => player.name.toUpperCase() === playerName.name.toUpperCase()
      )
    ) {
      throw new Error('Duplicate player name')
    }
    game.categories.push({ name: playerName })
    game.save()

    return
  } catch (error) {
    throw new Error(error)
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
    return project
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
  checkPassword,
  startGame,
  addPlayer,
  updatePlayerStatus,
  removePlayer,
}
