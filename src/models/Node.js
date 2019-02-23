import mongoose from 'mongoose'
import BaseModel from './BaseModel'
import './connection'

const NodeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    required: true
  },
  view: Object,
  data: Object,
  channels: Map
}, {
  id: false,
  strict: false
})

const Node = BaseModel(mongoose.model('Node', NodeSchema))

// Node.eventEmitter.addListener('insert', (model, key) => console.log(model))
// Node.eventEmitter.addListener('delete', (model, key) => console.log(model))
// Node.eventEmitter.addListener('replace', (model, key) => console.log(model))

export default Node
