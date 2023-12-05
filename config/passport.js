const passport = require('passport')
const LocalStrategy = require('passport-local')
const bcrypt = require('bcryptjs')
const { User, Restaurant, Like } = require('../models')

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true
    },
    (req, email, password, done) => {
      User.findOne({ where: { email } })
        .then(user => {
          if (!user) {
            return done(
              null,
              false,
              req.flash('error_messages', 'Email or Password incorrect.')
            )
          }
          bcrypt.compare(password, user.password).then(isMatch => {
            if (!isMatch) {
              return done(
                null,
                false,
                req.flash('error_messages', 'Email or Password incorrect.')
              )
            }
            return done(null, user)
          })
        })
        .catch(err => done(err, false))
    }
  )
)

passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser((id, done) => {
  User.findByPk(id, {
    include: [
      { model: Restaurant, as: 'FavoritedRestaurants' },
      { model: Restaurant, as: 'LikedRestaurants' }
    ]
  })
    .then(user => {
      return done(null, user.toJSON())
    })
    .catch(err => done(err))
})

module.exports = passport
