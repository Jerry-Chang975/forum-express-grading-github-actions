const express = require('express')
const router = express.Router()

const restController = require('../controllers/restaurants-controller')

router.get('/restaurants', restController.getRestaurants)

router.get('/', (req, res) => res.redirect('/restaurants'))

module.exports = router
