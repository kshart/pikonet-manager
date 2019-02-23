import mongoose from 'mongoose'
import BaseModel from './BaseModel'
import './connection'

/**
 * @constructor Server
 */
const ServerSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  /**
   * Таймаут после потеди связи, до её востановления
   * Если 0 соединение не востанавливается
   */
  reconnectTimeout: {
    type: Number,
    default: 5,
    required: true
  },
  url: {
    port: { // Required. Port the socket should connect to.
      type: Number,
      default: 69,
      required: true
    },
    host: { // Host the socket should connect to. Default: 'localhost'
      type: String,
      default: 'localhost'
    },
    localAddress: { // Local address the socket should connect from.
      type: String
    },
    localPort: { // Local port the socket should connect from.
      type: Number
    },
    family: { // Version of IP stack, can be either 4 or 6. Default: 4.
      type: Number
    },
    hints: { // Optional dns.lookup() hints.
      type: Number
    }
  }
}, {
  id: false,
  strict: true
})

const Server = BaseModel(mongoose.model('Server', ServerSchema))

// Server.eventEmitter.addListener('insert', (model, key) => console.log(model))
// Server.eventEmitter.addListener('delete', (model, key) => console.log(model))
// Server.eventEmitter.addListener('replace', (model, key) => console.log(model))

export default Server
