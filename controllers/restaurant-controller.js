const { Restaurant, Category, Comment, User, Favorite } = require('../models')
const { getOffset, getPagination } = require('../helpers/pagination-helper')
const restaurant = require('../models/restaurant')
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
    const DEFAULT_LIMIT = 9
    const categoryId = Number(req.query.categoryId) || ''
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || DEFAULT_LIMIT
    const offset = getOffset(limit, page)

    return Promise.all([
      Restaurant.findAndCountAll({
        include: Category,
        where: categoryId ? { categoryId } : {},
        limit,
        offset,
        nest: true,
        raw: true
      }),
      Category.findAll({ raw: true })
    ])
      .then(([restaurants, categories]) => {
        const favoritedRestaurantsId = req.user && req.user.FavoritedRestaurants.map(r => r.id)
        const likedRestaurantsId = req.user && req.user.LikedRestaurants.map(r => r.id)
        const data = restaurants.rows.map(r => ({
          ...r,
          description: r.description.substring(0, 50),
          isFavorited: req.user && favoritedRestaurantsId.includes(r.id),
          isLiked: req.user && likedRestaurantsId.includes(r.id)
        }))
        return res.render('restaurants', {
          restaurants: data,
          categories,
          categoryId,
          pagination: getPagination(limit, page, restaurants.count)
        })
      })
      .catch(err => next(err))
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
