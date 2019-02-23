import EventEmitter from 'events'

export default Model => {
  Model.eventEmitter = new EventEmitter()
  Model.byIndex = new Map()
  Model.byId = new Map()

  Model.watch().on('change', event => {
    switch (event.operationType) {
      case 'insert': {
        const { fullDocument, documentKey: { _id } } = event
        const documentKey = _id.toString()
        console.log('insert', fullDocument, documentKey)
        Model.byIndex.set(documentKey, fullDocument)
        Model.byId.set(fullDocument.id, fullDocument)
        Model.eventEmitter.emit('insert', fullDocument, documentKey)
        return
      }
      case 'delete': {
        const { documentKey: { _id } } = event
        const documentKey = _id.toString()
        console.log('delete', documentKey)
        const fullDocument = Model.byIndex.get(documentKey)
        if (!fullDocument) {
          console.error(`Model ${documentKey} не найден`)
          return
        }
        Model.byIndex.delete(documentKey)
        Model.byId.delete(fullDocument.id)
        Model.eventEmitter.emit('delete', fullDocument, documentKey)
        return
      }
      case 'replace': {
        const { fullDocument, documentKey: { _id } } = event
        const documentKey = _id.toString()
        console.log('replace', documentKey, fullDocument)
        Model.byIndex.set(documentKey, fullDocument)
        Model.byId.set(fullDocument.id, fullDocument)
        Model.eventEmitter.emit('replace', fullDocument, documentKey)
        return
      }
      case 'update': {
        const { updateDescription, documentKey: { _id } } = event
        const documentKey = _id.toString()
        const fullDocument = Model.byIndex.get(documentKey)
        for (let fieldName in updateDescription.updatedFields) {
          fullDocument[fieldName] = updateDescription.updatedFields[fieldName]
        }
        for (let fieldName of updateDescription.removedFields) {
          delete fullDocument[fieldName]
        }
        Model.eventEmitter.emit('update', fullDocument, documentKey)
        return
      }
      default:
        console.log(event)
    }
  })

  Model.find().exec().then(models => {
    for (let model of models) {
      const documentKey = model._id.toString()
      Model.byIndex.set(documentKey, model._doc)
      Model.byId.set(model.id, model._doc)
    }
    Model.eventEmitter.emit('init')
  })
  return Model
}

// Model.eventEmitter.addListener('insert', (model, key) => console.log(model))
// Model.eventEmitter.addListener('delete', (model, key) => console.log(model))
// Model.eventEmitter.addListener('replace', (model, key) => console.log(model))
