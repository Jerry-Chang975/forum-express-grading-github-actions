const passport = require('../config/passport')
const authenticated = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err || !user) return res.status(401).json({ status: 'error', message: 'unauthorized' })
    req.user = user // 自定義callback function後就不會自動將成功login的user加入req裡，要自行加入(ref: https://github.com/jaredhanson/passport/blob/master/lib/middleware/authenticate.js)
    next()
  })(req, res, next)
}
const authenticatedAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) return next()
  return res.status(403).json({ status: 'error', message: 'permission denied' })
}

module.exports = {
  authenticated,
  authenticatedAdmin
}
