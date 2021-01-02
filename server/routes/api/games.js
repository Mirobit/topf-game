const express = require('express')
const router = express.Router()
const gamesService = require('../../services/games')

// Single
router.get('/:gameId', async (req, res) => {
  try {
    const game = await gamesService.get(req.params.gameId)
    res.json({ status: true, game })
  } catch (error) {
    console.log(error)
    res.json({ status: false })
  }
})

// List
router.get('/', async (req, res) => {
  try {
    const games = await gamesService.list()
    res.json({ status: true, games })
  } catch (error) {
    console.log(error)
    res.json({ status: false })
  }
})

// New
router.post('/', async (req, res) => {
  try {
    const gameId = await gamesService.create({
      name: req.body.name,
      description: req.body.description,
      rounds: req.body.rounds,
      timer: req.body.timer,
      wordsCount: req.body.wordsCount,
      password: req.body.password,
    })
    res.json({ status: true, gameId })
  } catch (error) {
    console.log(error)
    res.json({ status: false })
  }
})

// Update
router.put('/:gameId', async (req, res) => {
  try {
    await gamesService.update(req.params.gameId, {
      name: req.body.name,
      description: req.body.description,
    })
    res.json({ status: true })
  } catch (error) {
    console.log(error)
    res.json({ status: false })
  }
})

// Remove
router.delete('/:gameId', async (req, res) => {
  try {
    await gamesService.remove(req.params.gameId)
    res.json({ status: true })
  } catch (error) {
    console.log(error)
    res.json({ status: false })
  }
})

// Join game
router.post('/join', async (req, res) => {
  try {
    const game = await gamesService.join(
      req.body.gameId,
      req.body.playerName,
      req.body.password
    )
    res.json({ status: true, game })
  } catch (error) {
    if (!error.stack) res.json({ status: false, message: error.message })
    else {
      res.json({ status: false })
      // TODO use winston
      console.log(error.stack)
    }
  }
})

// Add player
router.post('/:gameId/player', async (req, res) => {
  try {
    await gamesService.addCategory(req.params.gameId, req.body.playerName)
    res.json({ status: true })
  } catch (error) {
    console.log(error)
    res.json({ status: false })
  }
})

// Update player status
router.put('/:gameId/player/:playerName', async (req, res) => {
  try {
    await gamesService.updateCategory(
      req.params.gameId,
      req.params.playerName,
      req.body.status
    )
    res.json({ status: true })
  } catch (error) {
    console.log(error)
    res.json({ status: false })
  }
})

// Remove Player
router.put('/:gameId/player/:playerName', async (req, res) => {
  try {
    await gamesService.removeCategory(req.params.gameId, req.params.playerName)
    res.json({ status: true })
  } catch (error) {
    console.log(error)
    res.json({ status: false })
  }
})

module.exports = router
