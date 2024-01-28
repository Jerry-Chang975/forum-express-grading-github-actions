const { Restaurant, Category } = require('../models')
const { localFileHandler } = require('../helpers/file-helpers')
const adminService = {
  // restaurants
  getRestaurants: (req, callback) => {
    Restaurant.findAll({ raw: true, nest: true, include: [Category] })
      .then(restaurants => callback(null, restaurants))
      .catch(err => callback(err))
  },
  postRestaurant: (req, callback) => {
    const { name, tel, address, openingHours, description, categoryId } =
      req.body
    if (!name) throw new Error('Restaurant name is required!')
    // file handle
    const file = req.file
    localFileHandler(file).then(filePath => {
      Restaurant.create({
        name,
        tel,
        address,
        openingHours,
        description,
        image: filePath || null,
        categoryId
      })
        .then(newRestaurant => callback(null, { restaurant: newRestaurant }))
        .catch(err => callback(err))
    })
  },
  deleteRestaurant: (req, callback) => {
    Restaurant.findByPk(req.params.id).then(restaurant => {
      if (!restaurant) {
        const err = new Error("Restaurant didn't exist!")
        err.status = 404
        throw err
      }
      return restaurant.destroy()
    })
      .then(deletedRestaurant => callback(null, { restaurant: deletedRestaurant }))
      .catch(err => callback(err))
  }
}

module.exports = adminService
