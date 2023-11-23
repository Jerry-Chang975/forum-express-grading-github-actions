const { Restaurant, Category, Comment, User } = require('../models')
const { getOffset, getPagination } = require('../helpers/pagination-helper')
const restaurantController = {
  getRestaurant: (req, res, next) => {
    return Restaurant.findByPk(req.params.id, {
      include: [Category, { model: Comment, include: User }],
      nest: true,
      raw: false,
      order: [[{ model: Comment, as: 'Comments' }, 'createdAt', 'DESC']]
    })
      .then(restaurant => {
        if (!restaurant) throw new Error('Restaurant dose not exist!')
        // record view counts
        restaurant.increment('view_counts', { by: 1 })
        return res.render('restaurant', { restaurant: restaurant.toJSON() })
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
        const data = restaurants.rows.map(r => ({
          ...r,
          description: r.description.substring(0, 50)
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
    return Restaurant.findByPk(req.params.id, {
      include: [Category, Comment],
      nest: true,
      raw: false
    })
      .then(restaurant => {
        if (!restaurant) throw new Error('Restaurant dose not exist!')

        // get comment counts of restaurant
        restaurant = restaurant.toJSON()
        restaurant.commentCounts = restaurant.Comments
          ? restaurant.Comments.length
          : 0
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
  }
}
module.exports = restaurantController
