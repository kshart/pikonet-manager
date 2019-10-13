import net from 'net'
import Node from '@/models/Node'
import inputTypes from '@server/net/inputTypes'
import outputTypes from './outputTypes'
import EventEmitter from 'events'

const Stages = {
  BEFORE_CONNECT: 'BEFORE_CONNECT',
  WAIT_INFO: 'WAIT_INFO'
}

export default class Client extends EventEmitter {
  static delimiter = '\n'

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
  onNodeModelUpdate = null

  constructor ({ serverModel }) {
    super()
    /**
     * @type {String}
     */
    this.id = serverModel.id
    /**
     * @type {module:models.Server}
     */
    this.serverModel = serverModel
    /**
     * Список нод на сервере
     * @type {WeakSet<module:models.Node>}
     */
    this.nodes = new WeakSet()
    /**
     * Список поддерживаемых типов нод.
     * @type {Array<String>}
     */
    this.nodeTypeSupport = []
    /**
     * Стадия соединения
     */
    this.stage = Stages.BEFORE_CONNECT
    /**
     * Сырые данные из сокета
     */
    this._rawDataFromSocket = null
    this.onNodeModelInsert = (nodeConf, key) => {
      const { _id, __v, ...node } = nodeConf
      this.send(outputTypes.nodeCreated, { node })
    }
    this.onNodeModelDelete = (nodeConf, key) => {
      this.send(outputTypes.nodeDeleted, { id: nodeConf.id })
    }
    this.onNodeModelUpdate = (nodeConf, key) => {
      const { _id, __v, ...node } = nodeConf
      this.send(outputTypes.nodeUpdated, { nodeId: node.id, node })
    }
    Node.eventEmitter.addListener('insert', this.onNodeModelInsert)
    Node.eventEmitter.addListener('delete', this.onNodeModelDelete)
    Node.eventEmitter.addListener('replace', this.onNodeModelUpdate)
    Node.eventEmitter.addListener('update', this.onNodeModelUpdate)
    /**
     * @type {net.Socket}
     */
    this.socket = net.createConnection(serverModel.url, () => {
      if (this.stage === Stages.BEFORE_CONNECT) {
        this.stage = Stages.WAIT_INFO
        this.send(inputTypes.serverConnect)
      }
    })
      .setEncoding('utf8')
      .on('data', chunk => {
        const buffer = this._rawDataFromSocket !== null ? this._rawDataFromSocket + chunk : chunk
        const requests = buffer.split(Client.delimiter)
        if (requests.length === 1) {
          this._rawDataFromSocket = requests[0]
        } else if (requests.length > 1) {
          for (let i = 0; i < requests.length - 1; ++i) {
            this.handleRequest(requests[i])
          }
          if (requests[requests.length - 1] !== '') {
            this._rawDataFromSocket = requests[requests.length - 1]
          }
        }
      })
      .on('error', err => console.log(`Ошибка соединения с сервером ${serverModel.id}`, err))
      .on('close', () => this.destructor())

    console.log(`Соединение с сервером ${serverModel.id} установленно`)
  }

  destructor () {
    console.log('ServerClient destructor')
    Node.eventEmitter.removeListener('insert', this.onNodeModelInsert)
    Node.eventEmitter.removeListener('delete', this.onNodeModelDelete)
    Node.eventEmitter.removeListener('replace', this.onNodeModelUpdate)
    Node.eventEmitter.removeListener('update', this.onNodeModelUpdate)
    this.emit('close', this)
    if (this.socket) {
      this.socket.end()
    }
  }

  /**
   * Отправить пакет
   * @param {String} method тип пакета
   * @param {Object} params "полезная нагрузка", зависит от типа пакета
   */
  send (method, params = {}) {
    this.socket.write(
      JSON.stringify({
        method,
        params
      }) + Client.delimiter
    )
  }

  /**
   * Обработать запрос
   * @param {String} request Запрос.
   */
  handleRequest (request) {
    try {
      let { method, params } = JSON.parse(request)
      const methodName = 'on' + method.capitalize()
      if (typeof this[methodName] === 'function') {
        this[methodName](params)
      } else {
        console.log(`Метод "${methodName}" не найден`)
      }
    } catch (error) {
      console.error(error, request)
      this.send('error')
    }
  }

  /**
   * Добавить ноду на сервер
   * @param {module:models.Node} nodeModel
   */
  addNode (nodeModel) {
    console.log('addNode')
    this.send(inputTypes.nodeCreate, { node: nodeModel })
  }

  onServerHello ({ name, nodesCount, nodeTypeSupport }) {
    if (nodeTypeSupport instanceof Array) {
      this.nodeTypeSupport = nodeTypeSupport
    }
    if (nodesCount > 0) {
      console.info('Необходимо синхронизировать ноду')
    } else {

    }
    this.emit('ready', this)
  }

  onNodeList (payload) {
    console.log('NODE_LIST', payload)
  }
  onNodeChannelList (payload) {
    console.log('NODE_CHANNEL_LIST', payload)
  }
}
