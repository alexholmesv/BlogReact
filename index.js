const crypto = require('crypto')
const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
mongoose.connect('mongodb://localhost/emily-api')
const Users = require('./users.model')
const Posts = require('./posts.model')
const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

function signToken(id) {
  return jwt.sign({ _id: id }, 'my-secret', {
    expiresIn: 60 * 60 * 50000
  });
}

const isAuthenticated = (req, res, next) => {
  const token = req.headers.authorization
  if(!token) return res.sendStatus(403)
  jwt.verify(token, 'my-secret', (err, decoded) => {
    const { _id } = decoded
    Users.findOne({ _id }).exec()
      .then(user => {
        req.user = user
        next()
      })
  })
}

app.get('/posts', isAuthenticated, function(req, res) {
  Posts.find().exec()
    .then(posts => res.send(posts))
})

app.post('/posts', isAuthenticated, function(req, res) {
  Posts.create(Object.assign(req.body, { user_id: req.user._id }))
    .then(() => res.sendStatus(201))
})

app.post('/posts/:id/comments',
  isAuthenticated, function(req, res){
    Posts.findOne({ _id: req.params.id }).exec()
    .then(post => {
      if(!post) {
        return res.sendStatus(404)
      }
      post.comments.push({
        user_id: req.user_id,
        text: req.body.text, 
      })
      post.save
      res.sendStatus(201)
    })
})

app.post('/registro', function (req, res) {
  const { email, password } = req.body
  crypto.randomBytes(16, (err, salt) => {
    const newSalt = salt.toString('base64')
    crypto.pbkdf2(password, newSalt, 10000, 64, 'sha1', (err, key) => {
      const encryptedPassword = key.toString('base64')
      Users.findOne({ email }).exec()
        .then(user => {
          if(user) return res.send('usuario ya existe')
          Users.create({
            email,
            password: encryptedPassword,
            salt: newSalt,
          }).then(() => {
            res.send('usuario creado con éxito')
          })
        })
    })
  })
})

app.post('/login', function (req, res) {
  const { email, password } = req.body
  Users.findOne({ email }).exec()
    .then(user => {
      if(!user) return res.send('usuario no existe')
      crypto.pbkdf2(password, user.salt, 10000, 64, 'sha1', (err, key) => {
        const encryptedPassword = key.toString('base64')
        if(user.password === encryptedPassword) {
          var token = signToken(user._id)
          return res.send({ token })
        }
        res.send('oops!')
      })
    })
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
