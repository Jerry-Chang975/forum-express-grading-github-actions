const { Restaurant, Category } = require('../models')
const restaurantController = {
  getRestaurant: (req, res, next) => {
    return Restaurant.findByPk(req.params.id, { include: Category, nest: true, raw: true }).then(restaurant => {
      if (!restaurant) throw new Error('Restaurant dose not exist!')
      return res.render('restaurant', { restaurant })
    }).catch(err => next(err))
  },
  getRestaurants: (req, res, next) => {
    return Restaurant.findAll({
      include: Category,
      nest: true,
      raw: true
    }).then(restaurants => {
      const data = restaurants.map(r => ({ ...r, description: r.description.substring(0, 50) }))
      return res.render('restaurants', { restaurants: data })
    }).catch(err => next(err))
  }
}
module.exports = restaurantController
