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
  onNodeModelInsert = null
  /**
   * Коллбек
   * @type {Function}
   */
  onNodeModelDelete = null
  /**
   * Коллбек
   * @type {Function}
   */
  onNodeModelReplace = null

  constructor ({ request, wSocket }) {
    console.log(`EditorClient create ${request.origin}`)
    this.lastResposeId = 0
    this.wSocket = wSocket
    this.onNodeModelInsert = (nodeConf, key) => {
      const { _id, __v, ...node } = nodeConf
      this.send(outputTypes.nodeCreated, { node })
    }
    this.onNodeModelDelete = (node, key) => {
      console.log('delete node')
      this.send(outputTypes.nodeDeleted, { id: node.id })
    }
    this.onNodeModelReplace = (node, key) => {
      console.log(node)
    }
    Node.eventEmitter.addListener('insert', this.onNodeModelInsert)
    Node.eventEmitter.addListener('delete', this.onNodeModelDelete)
    Node.eventEmitter.addListener('replace', this.onNodeModelReplace)
  }

  destructor () {
    console.log('EditorClient destructor')
    Node.eventEmitter.removeListener('insert', this.onNodeModelInsert)
    Node.eventEmitter.removeListener('delete', this.onNodeModelDelete)
    Node.eventEmitter.removeListener('replace', this.onNodeModelReplace)
  }

  /**
   * Отправить пакет
   * @param {String} method - Тип пакета.
   * @param {Object} params - "полезная нагрузка", зависит от типа пакета.
   * @param {String} requestId - ID запроса, для которого предназначен этот ответ.
   */
  send (method, params = null, requestId = null) {
    this.lastResposeId++
    this.wSocket.send(
      JSON.stringify({
        id: this.lastResposeId,
        requestId,
        method,
        params
      })
    )
  }

  /**
   * Обработать запрос
   * @param {module:net/editor.Request} request тело запроса
   */
  handleRequest (request) {
    const { id, requestId, method, params } = request
    const methodName = 'on' + method.capitalize()
    if (typeof this[methodName] === 'function') {
      this[methodName](params, { id, requestId })
    } else {
      console.log(`Метод "${methodName}" не найден`)
    }
  }

  onNodeGetList (params, { id }) {
    this.watchUpdateNodes = true
    this.send(outputTypes.nodeList, {
      nodes: Array.from(Node.byId, ([, nodeModel]) => {
        const { _id, __v, ...conf } = nodeModel
        return conf
      })
    }, id)
  }
  onNodeCreate ({ node }) {
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
  onNodeUpdate ({ nodes }) {
    for (let node of nodes) {
      Node.findOneAndUpdate({ id: node.id }, node).catch(error => console.error(error))
    }
  }
  onNodeDelete ({ id }) {
    Node.deleteOne({ id }, err => {
      if (err) {
        console.error(err)
      } else {
        console.log(`Нода '${id}' удалена.`)
      }
    })
  }
  onLinkGetList () {
    this.watchUpdateLinks = true
    this.send(outputTypes.linkList, { links: Array.from(Link.byId, ([, linkModel]) => linkModel) })
  }
  onLinkCreate ({ link }) {
    const linkModel = new Link(link)
    linkModel.save().catch(error => console.error(error))
  }
  onLinkDelete ({ id }) {
    Link.deleteOne({ id }, err => {
      if (err) {
        console.error(err)
      } else {
        console.log(`Линк '${id}' удален.`)
      }
    })
  }

  onChannelWatch ({ channel }) {
    this.addChannelWatcher(channel)
  }
  onChannelUnwatch ({ channel }) {
    this.removeChannelWatcher(channel)
  }
  onGetChannelList ({ nodeId }, { id }) {
    this.send('nodeChannelList', { nodeId, channels: [1, 2, 3, 4] }, id)
  }
}
