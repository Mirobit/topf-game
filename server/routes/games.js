const express = require('express')
const router = express.Router()
const gameService = require('../../services/games')

// Single
router.get('/:gameId', async (req, res) => {
  try {
    const game = await gameService.get(req.params.gameId)
    res.json({ status: true, game })
  } catch (error) {
    console.log(error)
    res.json({ status: false })
  }
})

// List
router.get('/', async (req, res) => {
  try {
    const games = await gameService.list()
    res.json({ status: true, games })
  } catch (error) {
    console.log(error)
    res.json({ status: false })
  }
})

// New
router.post('/', async (req, res) => {
  try {
    await gameService.create({
      name: req.body.name,
      description: req.body.description,
      rounds: req.body.rounds,
      timer: req.body.timer,
      password: req.body.password,
    })
    res.json({ status: true })
  } catch (error) {
    console.log(error)
    res.json({ status: false })
  }
})

// Update
router.put('/:gameId', async (req, res) => {
  try {
    await gameService.update(req.params.gameId, {
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
    await gameService.remove(req.params.gameId)
    res.json({ status: true })
  } catch (error) {
    console.log(error)
    res.json({ status: false })
  }
})

// Check Passswort
router.post('/password', async (req, res) => {
  try {
    const result = await gameService.checkPassword(
      req.body.gameId,
      req.body.password
    )
    res.json({ status: true, valid: result })
  } catch (error) {
    console.log(error)
    res.json({ status: false })
  }
})

// Add Player
router.post('/:gameId/player', async (req, res) => {
  try {
    await gameService.addCategory(req.params.gameId, req.body.playerName)
    res.json({ status: true })
  } catch (error) {
    console.log(error)
    res.json({ status: false })
  }
})

// Update Player Status
router.put('/:gameId/player/:playerName', async (req, res) => {
  try {
    await gameService.updateCategory(
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
    await gameService.removeCategory(req.params.gameId, req.params.playerName)
    res.json({ status: true })
  } catch (error) {
    console.log(error)
    res.json({ status: false })
  }
})

module.exports = router
