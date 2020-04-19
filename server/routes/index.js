const express = require('express')
const router = express.Router()
const path = require('path')

// App
router.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/index.html'))
})

router.use((req, res) => {
  res.status(404).send({ error: 'not-found' })
})

module.exports = router
