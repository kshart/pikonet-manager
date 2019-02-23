import net from 'net'
import EventEmitter from 'events'
import inputTypes from '@server/net/inputTypes'
import outputTypes from '@server/net/outputTypes'
import SocketServer from './Disposer'

const Stages = {
  BEFORE_CONNECT: 'BEFORE_CONNECT',
  WAIT_INFO: 'WAIT_INFO'
}

export default class Client extends EventEmitter {
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
     * @type {net.Socket}
     */
    this.socket = net.createConnection(serverModel.url, () => {
      if (this.stage === Stages.BEFORE_CONNECT) {
        this.stage = Stages.WAIT_INFO
        this.send(inputTypes.serverConnect)
      }
    })
      .on('data', data => {
        try {
          const request = JSON.parse(data.toString())
          this.handleRequest(request)
        } catch (error) {
          console.error(error, data)
          this.send('error')
        }
      })
      .on('error', err => console.log(`Ошибка соединения с сервером ${serverModel.id}`, err))
      .on('close', () => console.log('Соединение закрыто'))

    console.log(`Соединение с сервером ${serverModel.id} установленно`)
  }

  destructor () {
    this.emit('close', this)
    if (this.socket) {
      this.socket.end()
    }
  }

  /**
   * Отправить пакет
   * @param {String} type тип пакета
   * @param {Object} payload "полезная нагрузка", зависит от типа пакета
   */
  send (type, payload = {}) {
    this.socket.write(
      JSON.stringify({
        type,
        payload
      })
    )
  }

  /**
   * Обработать запрос
   * @param {module:net/server.Request} request тело запроса
   */
  handleRequest ({ type, payload }) {
    const method = 'on' + type.capitalize()
    if (typeof this[method] === 'function') {
      this[method](payload)
    } else {
      console.log(`Метод "${method}" не найден`)
    }
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
