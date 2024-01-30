const passport = require('passport')
const LocalStrategy = require('passport-local')
const passportJWT = require('passport-jwt')
const bcrypt = require('bcryptjs')
const { User, Restaurant } = require('../models')

const JWTStrategy = passportJWT.Strategy
const ExtractJWT = passportJWT.ExtractJwt

passport.use(
  new LocalStrategy( // cookie-base & token-base 皆會使用此strategy進行驗證
    {
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true
    },
    (req, email, password, done) => {
      User.findOne({ where: { email } })
        .then(user => {
          if (!user) {
            req.flash('error_messages', 'Email or Password incorrect.')
            return done(null, false, { message: 'Email or Password incorrect.' })
          }
          bcrypt.compare(password, user.password).then(isMatch => {
            if (!isMatch) {
              req.flash('error_messages', 'Email or Password incorrect.')
              return done(null, false, { message: 'Email or Password incorrect.' })
            }
            return done(null, user)
          })
        })
        .catch(err => done(err, false))
    }
  )
)

const jwtOptions = {
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
}

passport.use(new JWTStrategy(jwtOptions, (jwtPayload, callback) => {
  User.findByPk(jwtPayload.id, { // 解出token後，透過payload裡的id在DB找user data
    include: [
      { model: Restaurant, as: 'FavoritedRestaurants' },
      { model: Restaurant, as: 'LikedRestaurants' },
      { model: User, as: 'Followers' },
      { model: User, as: 'Followings' }
    ]
  })
    .then(user => callback(null, user))
    .catch(err => callback(err, false))
})
)

passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser((id, done) => {
  User.findByPk(id, {
    include: [
      { model: Restaurant, as: 'FavoritedRestaurants' },
      { model: Restaurant, as: 'LikedRestaurants' },
      { model: User, as: 'Followers' },
      { model: User, as: 'Followings' }
    ]
  })
    .then(user => {
      return done(null, user.toJSON())
    })
    .catch(err => done(err))
})

module.exports = passport
