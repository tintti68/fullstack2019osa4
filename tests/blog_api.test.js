const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const helper = require('./test_helper')
const api = supertest(app)

const User = require('../models/user')
const Blog = require('../models/blog')

var auth = {};

test('login', async () => {
  data = {"username":"root", "password":"salainen"}
  const response= await api 
    .post('/api/login')
    .send(data)
    .expect(200)
  auth['token'] = response.body.token
})

test('blogs are returned as json', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('id palautetaan', async() => {
    await api
      .get("/api/blogs")
      .then((r) => {
        expect(r.body[0].id).toBeDefined();
      });
})

test('postaa blog', async() => {
  const response = await api.get('/api/blogs')
  let initialblogs = response.body.length
  let data = {"title": "testiotsikkox",
              "author": "tekijax",
              "url": "foo.org",
              "likes": 0}
  await api
    .post("/api/blogs")
    .set('Authorization', 'bearer ' + auth.token)
    .send(data)
    .expect(201)
  
    const response2 = await api.get('/api/blogs')
    expect(response2.body.length).toBe(initialblogs + 1)
})

test('likes ilman arvoa', async() => {
  let data = {"title": "ei likes3",
              "author": "gg3",
               "url": "foo.org"}
  const response = await api
  .post("/api/blogs")
  .set('Authorization', 'bearer ' + auth.token)
  .send(data)
  .expect(201)

  expect(response.body.likes).toBe(0)
})

test('ei otsikko eikä urlia', async() => {
  let data = {"author": "gg3"}
  await api
    .post("/api/blogs")
    .set('Authorization', 'bearer ' + auth.token)
    .send(data)
    .expect(400)
})

describe('when there is initially one user at db', () => {
   beforeEach(async () => {
    await User.deleteMany({})
    const user = new User({ username: 'root', password: 'salainen' })
    await user.save()
  }) 

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'teppotestaaja',
      name: 'Teppo vaan',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .set('Authorization', 'bearer ' + auth.token)
      .send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd.length).toBe(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    expect(usernames).toContain(newUser.username)
  })

  test('creation not succeeds with too short username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'te',
      name: 'pp',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .set('Authorization', 'bearer ' + auth.token)
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd.length).toBe(usersAtStart.length)
  })
})


test('creation fails with proper statuscode and message if username already taken', async () => {
  const usersAtStart = await helper.usersInDb()

  const newUser = {
    username: 'root',
    name: 'Superuser',
    password: 'salainen',
  }

  const result = await api
    .post('/api/users')
    .set('Authorization', 'bearer ' + auth.token)
    .send(newUser)
    .expect(400)
    .expect('Content-Type', /application\/json/)

  expect(result.body.error).toContain('`username` to be unique')

  const usersAtEnd = await helper.usersInDb()
  expect(usersAtEnd.length).toBe(usersAtStart.length)
})


afterAll(() => {
  mongoose.connection.close()
})