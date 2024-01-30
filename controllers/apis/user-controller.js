const jwt = require('jsonwebtoken')
const userServices = require('../../services/user-services')
const userController = {
  signIn: (req, res, next) => {
    try {
      const token = jwt.sign(req.user.toJSON(), process.env.JWT_SECRET, {
        expiresIn: '30d'
      })
      res.json({
        status: 'success',
        data: {
          token,
          user: req.user
        }
      })
    } catch (err) {
      res.status(401).json({ status: 'error', message: 'Authentication failed' })
    }
  },
  signUp: (req, res, next) => {
    userServices.signUp(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  }
}

module.exports = userController
