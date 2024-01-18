const adminService = require('../../services/admin-services')
const adminController = {
  // restaurants
  getRestaurants: (req, res, next) => {
    adminService.getRestaurants(req, (err, data) =>
      err ? next(err) : res.json(data)
    )
  }
}

module.exports = adminController
