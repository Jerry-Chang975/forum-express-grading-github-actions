const bcrypt = require('bcryptjs')
const helpers = require('../helpers/auth-helpers')
const db = require('../models')
const { localFileHandler } = require('../helpers/file-helpers')
const { User, Comment, Restaurant, Favorite } = db
const userController = {
  signUpPage: (req, res) => {
    res.render('signup')
  },
  signUp: (req, res, next) => {
    if (req.body.password !== req.body.passwordCheck) {
      throw new Error('Password do not match!')
    }

    User.findOne({ where: { email: req.body.email } })
      .then(user => {
        if (user) throw new Error('Email already exists!')
        return bcrypt.hash(req.body.password, 10)
      })
      .then(hash =>
        User.create({
          name: req.body.name,
          email: req.body.email,
          password: hash
        })
      )
      .then(() => {
        req.flash('success_msg', 'You have successfully signed up!')
        res.redirect('/signin')
      })
      .catch(error => next(error))
  },
  signInPage: (req, res) => {
    res.render('signin')
  },
  signIn: (req, res) => {
    req.flash('success_messages', 'Success to log in!')
    res.redirect('/restaurants')
  },
  logout: (req, res) => {
    req.flash('success_messages', 'Success to log out!')
    req.logout()
    res.redirect('/signin')
  },
  getUser: (req, res, next) => {
    return User.findByPk(req.params.id, {
      include: [{ model: Comment, include: Restaurant }],
      nest: true,
      raw: false
    })
      .then(user => {
        if (!user) throw new Error('User not found!')
        user = user.toJSON()
        user.commentCount = user.Comments ? user.Comments.length : 0
        res.render('users/profile', { user })
      })
      .catch(err => next(err))
  },
  editUser: (req, res, next) => {
    if (helpers.getUser(req).id !== parseInt(req.params.id)) throw new Error('Can only edit your own account')
    return User.findByPk(req.params.id, { raw: true })
      .then(user => {
        if (!user) throw new Error('User not found!')
        res.render('users/edit', { user })
      })
      .catch(err => next(err))
  },
  putUser: (req, res, next) => {
    if (parseInt(req.params.id) !== req.user.id) {
      throw new Error('Can only edit your own account')
    }
    const { name } = req.body
    const file = req.file
    return Promise.all([User.findByPk(req.params.id), localFileHandler(file)])
      .then(([user, filePath]) => {
        user.update({ name, image: filePath || user.image })
      })
      .then(() => {
        req.flash('success_messages', '使用者資料編輯成功')
        return res.redirect(`/users/${req.params.id}`)
      })
      .catch(err => next(err))
  },
  addFavorite: (req, res, next) => {
    const { restaurantId } = req.params
    return Promise.all([
      Restaurant.findByPk(restaurantId),
      Favorite.findOne({
        where: {
          userId: req.user.id,
          restaurantId
        }
      })
    ])
      .then(([restaurant, favorite]) => {
        if (!restaurant) throw new Error('Restaurant not found!')
        if (favorite) throw new Error('This restaurant has been added!')
        return Favorite.create({
          userId: req.user.id,
          restaurantId
        })
      })
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  },
  removeFavorite: (req, res, next) => {
    return Favorite.findOne({
      where: {
        userId: req.user.id,
        restaurantId: req.params.restaurantId
      }
    }).then(favorite => {
      if (!favorite) throw new Error('This restaurant had not been added!')
      return favorite.destroy()
    }).then(() => res.redirect('back'))
      .catch(err => next(err))
  }
}

module.exports = userController
