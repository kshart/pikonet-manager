import mongoose from 'mongoose'
import EventEmitter from 'events'
import './connection'

const LinkSchema = new mongoose.Schema({
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
  data: Object,
  channels: Map
}, {
  id: false,
  strict: true
})

const Link = mongoose.model('Link', LinkSchema)
Link.eventEmitter = new EventEmitter()
Link.byIndex = new Map()
Link.byId = new Map()

// NoLinkde.eventEmitter.addListener('insert', (model, key) => console.log(model))
// Link.eventEmitter.addListener('delete', (model, key) => console.log(model))
// Link.eventEmitter.addListener('replace', (model, key) => console.log(model))

Link.watch().on('change', event => {
  switch (event.operationType) {
    case 'insert': {
      const { fullDocument, documentKey: { _id } } = event
      const documentKey = _id.toString()
      console.log('insert', fullDocument, documentKey)
      Link.byIndex.set(documentKey, fullDocument)
      Link.byId.set(fullDocument.id, fullDocument)
      Link.eventEmitter.emit('insert', fullDocument, documentKey)
      return
    }
    case 'delete': {
      const { documentKey: { _id } } = event
      const documentKey = _id.toString()
      console.log('delete', documentKey)
      const fullDocument = Link.byIndex.get(documentKey)
      if (!fullDocument) {
        console.error(`Link ${documentKey} не найден`)
        return
      }
      Link.byIndex.delete(documentKey)
      Link.byId.delete(documentKey)
      Link.eventEmitter.emit('delete', fullDocument, documentKey)
      return
    }
    case 'replace': {
      const { fullDocument, documentKey: { _id } } = event
      const documentKey = _id.toString()
      console.log('replace', documentKey, fullDocument)
      Link.byIndex.set(documentKey, fullDocument)
      Link.byId.set(fullDocument.id, fullDocument)
      Link.eventEmitter.emit('replace', fullDocument, documentKey)
      return
    }
    default:
      console.log(event)
  }
})

Link.find().exec().then(links => {
  for (let link of links) {
    const documentKey = link._id.toString()
    Link.byIndex.set(documentKey, link)
    Link.byId.set(link.id, link)
  }
  Link.eventEmitter.emit('init')
})

export default Link
