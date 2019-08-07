var _ = require('lodash');

const dummy = (blogs) => {
    return 1
  }

const totalLikes = (blogs) => {
  return blogs.map(element => element.likes).reduce((a, b) => a + b, 0);
}

const favoriteBlog = (blogs) => {
  var current = -1
  var ret = {}
  for (const item of blogs) {
    if (item.likes > current) {
      current = item.likes
      ret = item
    }
  }
  return ret
}

const mostBlogs = (blogs) => {
  return _(blogs)
  .countBy("author")
  .map(function(count, author) { return { blogs: count, author: author }})
  .sortBy('-count')
  .last()
}

const mostLikes = (blogs) => {
  return   _(blogs)
  .groupBy('author')
  .map((objs, key) => ({
      'author': key,
      'likes': _.sumBy(objs, 'likes') }))
  .sortBy('likes')
  .last()
}
  
  module.exports = {
    dummy, totalLikes, favoriteBlog, mostBlogs, mostLikes
  }