import WSocketServer from './EditorDisposer'
import inputTypes from './inputTypes'
import outputTypes from './outputTypes'
import Node from '@/models/Node'
import Link from '@/models/Link'

export default class EditorClient {
  /**
   * Соединение
   * @type {websocket.connection}
   */
  wSocket = null

  /**
   * Коллбек
   * @type {Function}
   */
  onNodeInsert = null
  /**
   * Коллбек
   * @type {Function}
   */
  onNodeDelete = null
  /**
   * Коллбек
   * @type {Function}
   */
  onNodeReplace = null

  /**
   * Список опрашиваемых каналов
   * @deprecated Промежуточное решение
   * @type {Array<String>}
   */
  listenChannels = []

  constructor ({ request, wSocket }) {
    console.log(`EditorClient create ${request.origin}`)
    this.wSocket = wSocket
    this.onNodeInsert = (nodeConf, key) => {
      const { _id, __v, ...node } = nodeConf
      this.send(outputTypes.NODE_CREATED, { node })
    }
    this.onNodeDelete = (node, key) => {
      console.log('delete node')
      this.send(outputTypes.NODE_DELETED, { id: node.id })
    }
    this.onNodeReplace = (node, key) => {
      console.log(node)
    }
    Node.eventEmitter.addListener('insert', this.onNodeInsert)
    Node.eventEmitter.addListener('delete', this.onNodeDelete)
    Node.eventEmitter.addListener('replace', this.onNodeReplace)
  }
  destructor () {
    console.log('EditorClient destructor')
    Node.eventEmitter.removeListener('insert', this.onNodeInsert)
    Node.eventEmitter.removeListener('delete', this.onNodeDelete)
    Node.eventEmitter.removeListener('replace', this.onNodeReplace)
  }

  /**
   * @deprecated Промежуточное решение
   * @param {String} channel имя канала
   */
  addChannelWatcher (channel) {
    if (this.listenChannels.includes(channel)) {
      return
    }
    WSocketServer.addChannelWatcher(this, channel)
    this.listenChannels.push(channel)
  }
  /**
   * @deprecated Промежуточное решение
   * @param {String} channel имя канала
   */
  removeChannelWatcher (channel) {
    const index = this.listenChannels.indexOf(channel)
    if (index < 0) {
      return
    }
    WSocketServer.removeChannelWatcher(this, channel)
    this.listenChannels.splice(index, 1)
  }

  /**
   * Отправить пакет
   * @param {String} type тип пакета
   * @param {Object} payload "полезная нагрузка", зависит от типа пакета
   */
  send (type, payload = {}) {
    this.wSocket.send(
      JSON.stringify({
        ...payload,
        type
      })
    )
  }

  /**
   * Обработать запрос
   * @param {module:net/editor.Request} request тело запроса
   */
  handleRequest (request) {
    const { type, ...payload } = request
    if (typeof this[type] !== 'function') {
      console.error(`Неопределенный тип входящего пакета "${type}"`)
      return
    }
    this[type](payload)
  }

  [inputTypes.NODE_GET_LIST] () {
    this.watchUpdateNodes = true
    this.send(outputTypes.NODE_LIST, {
      nodes: Array.from(Node.byId, ([, nodeModel]) => {
        const { _id, __v, ...conf } = nodeModel
        return conf
      })
    })
  }
  [inputTypes.NODE_CREATE] ({ node }) {
    if (!node.id) {
      let lastId = Node.byId.size
      while (Node.byId.has(`Node${lastId}`)) {
        ++lastId
      }
      node.id = `Node${lastId}`
    }
    if (!node.view) {
      node.view = {
        position: {
          x: 0,
          y: 0
        },
        title: node.type
      }
    }
    const nodeModel = new Node(node)
    nodeModel.save().catch(error => console.error(error))
  }
  [inputTypes.NODE_UPDATE] ({ nodes }) {
    for (let node of nodes) {
      Node.findOneAndUpdate({ id: node.id }, node).catch(error => console.error(error))
    }
  }
  [inputTypes.NODE_DELETE] ({ id }) {
    Node.deleteOne({ id }, err => {
      if (err) {
        console.error(err)
      } else {
        console.log(`Нода '${id}' удалена.`)
      }
    })
  }
  [inputTypes.LINK_GET_LIST] () {
    this.watchUpdateLinks = true
    this.send(outputTypes.LINK_LIST, { links: Array.from(Link.byId, ([, linkModel]) => linkModel) })
  }
  [inputTypes.LINK_CREATE] ({ link }) {
    const linkModel = new Link(link)
    linkModel.save().catch(error => console.error(error))
  }
  [inputTypes.LINK_DELETE] ({ id }) {
    Link.deleteOne({ id }, err => {
      if (err) {
        console.error(err)
      } else {
        console.log(`Линк '${id}' удален.`)
      }
    })
  }
  [inputTypes.CHANNEL_WATCH] ({ channel }) {
    this.addChannelWatcher(channel)
  }
  [inputTypes.CHANNEL_UNWATCH] ({ channel }) {
    this.removeChannelWatcher(channel)
  }
}
