import mongoose from 'mongoose'
import BaseModel from './BaseModel'
import './connection'

const LinkSchema = new mongoose.Schema({
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  }
})
LinkSchema.index({ from: 1, to: 1 }, { unique: true })

const Link = BaseModel(mongoose.model('Link', LinkSchema), { indexingByID: false })

// Link.eventEmitter.addListener('insert', (model, key) => console.log(model))
// Link.eventEmitter.addListener('delete', (model, key) => console.log(model))
// Link.eventEmitter.addListener('replace', (model, key) => console.log(model))

export default Link
