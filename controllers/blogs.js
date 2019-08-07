const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')

/* const getTokenFrom = request => {
  const authorization = request.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.substring(7)
  }
  return null
} */

blogsRouter.get('/', async (request, response) => {
  const blogit = await Blog.find({}).populate('user', { username: 1, name: 1 })  
  response.json(blogit.map(blog => blog.toJSON()))
  })
  
blogsRouter.post('/', async (request, response, next) => {
    const body = request.body
    // const token = getTokenFrom(request)
    try {
      const decodedToken = jwt.verify(request.token, process.env.SECRET)

      if (!request.token || !decodedToken.id) {
        return response.status(401).json({ error: 'token missing or invalid' })
      }
      const user = await User.findById(decodedToken.id)
      const blog = new Blog(body)
      blog.user = user._id

      const talletettu = await blog.save()
      user.blogs = user.blogs.concat(talletettu._id)
      await user.save()
      response.status(201).json(talletettu.toJSON())

    } catch (exception){
      next(exception)
    }
  })

blogsRouter.delete('/:id', async (request, response, next) => {
    try {
      const decodedToken = jwt.verify(request.token, process.env.SECRET)

      if (!request.token || !decodedToken.id) {
        return response.status(401).json({ error: 'token missing or invalid' })
      }
      const user = await User.findById(decodedToken.id)
      const blogi = Blog.findById(request.params.id)
      if(user._id.toString() === blogi.user.toString()){
        blogi.remove()
        return response.status(204).end()
      }else{
        return response.status(401).json({ error: 'wrong username'})
      }
    } catch (exception) {
      next(exception)
    }
})

blogsRouter.put('/:id', (request, response, next) => {
  const body = request.body

  const blog = {
    likes: body.likes
  }

  Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
    .then(updatedBlog => {
      response.json(updatedBlog.toJSON())
    })
    .catch(error => next(error))
})
module.exports = blogsRouter