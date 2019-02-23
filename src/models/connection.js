import mongoose from 'mongoose'

mongoose.connect('mongodb://localhost/test', {
  useCreateIndex: true,
  useNewUrlParser: true
})
