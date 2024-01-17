const { Restaurant, Category, Comment, User, Favorite } = require('../../models')
const { getOffset, getPagination } = require('../../helpers/pagination-helper')
const restaurant = require('../../models/restaurant')
const restaurantService = require('../../services/restaurant-services')
const restaurantController = {
  getRestaurant: (req, res, next) => {
    return Restaurant.findByPk(req.params.id, {
      include: [
        Category,
        { model: Comment, include: User },
        { model: User, as: 'FavoritedUsers' },
        { model: User, as: 'LikedUsers' }
      ],
      nest: true,
      raw: false,
      order: [[{ model: Comment, as: 'Comments' }, 'createdAt', 'DESC']]
    })
      .then(restaurant => {
        const isFavorited = restaurant.FavoritedUsers.some(f => f.id === req.user.id)
        const isLiked = restaurant.LikedUsers.some(like => like.id === req.user.id)
        if (!restaurant) throw new Error('Restaurant dose not exist!')
        // record view counts
        restaurant.increment('view_counts', { by: 1 })
        return res.render('restaurant', {
          restaurant: restaurant.toJSON(),
          isFavorited,
          isLiked
        })
      })
      .catch(err => next(err))
  },
  getRestaurants: (req, res, next) => {
    restaurantService.getRestaurants(req, (err, data) => err ? next(err) : res.render('restaurants', data))
  },
  getDashboard: (req, res, next) => {
    return Promise.all([
      Restaurant.findByPk(req.params.id, {
        include: [Category, Comment],
        nest: true,
        raw: false
      }),
      Favorite.findAndCountAll({
        where: {
          restaurantId: req.params.id
        }
      })
    ])
      .then(([restaurant, favorite]) => {
        if (!restaurant) throw new Error('Restaurant dose not exist!')

        // get comment counts of restaurant
        restaurant = restaurant.toJSON()
        restaurant.commentCounts = restaurant.Comments
          ? restaurant.Comments.length
          : 0
        restaurant.favoriteCounts = favorite.count
        return res.render('dashboard', { restaurant })
      })
      .catch(err => next(err))
  },
  getFeeds: (req, res, next) => {
    Promise.all([
      Restaurant.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [Category],
        raw: true,
        nest: true
      }),
      Comment.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [User, Restaurant],
        raw: true,
        nest: true
      })
    ]).then(([restaurants, comments]) => {
      return res.render('feeds', { restaurants, comments })
    }).catch(err => next(err))
  },
  getTopRestaurants: (req, res, next) => {
    return Restaurant.findAll({
      include: [{ model: User, as: 'FavoritedUsers' }]
    })
      .then(restaurants => {
        const favoritedRestaurantsId =
          req.user && req.user.FavoritedRestaurants.map(r => r.id)
        restaurants = restaurants
          .map(restaurant => ({
            ...restaurant.toJSON(),
            favoritedCount: restaurant.FavoritedUsers.length,
            isFavorited: favoritedRestaurantsId && favoritedRestaurantsId.includes(restaurant.id)
          }))
          .sort((a, b) => b.favoritedCount - a.favoritedCount)
        return res.render('top-restaurants', { restaurants: restaurants.slice(0, 10) })
      })
      .catch(err => next(err))
  }
}
module.exports = restaurantController
