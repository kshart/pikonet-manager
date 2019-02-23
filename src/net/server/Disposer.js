import Client from './Client'
import NodeModel from '@/models/Node'
import ServerModel from '@/models/Server'

export default class Disposer {
  /**
   * Сервера
   * @type {Map<String, module:net/server.Client>}
   */
  static clients = new Map()

  /**
   * Сопоставление серверов и id нод
   * @type {Map<String, Array<String>>}
   */
  static clientNodes = new Map()

  static init () {
    ServerModel.eventEmitter.addListener('init', () => {
      for (let [, serverModel] of ServerModel.byId) {
        Disposer.connectToServer(serverModel)
      }
    })
    NodeModel.eventEmitter.addListener('init', () => {
      this.allocateFreeNodes()
    })
  }

  static allocateFreeNodes () {
    if (this.clients.size <= 0 || NodeModel.byId.size <= 0) {
      return
    }
    console.log(`allocateFreeNodes clients - ${this.clients.size} nodes - ${NodeModel.byId.size}`)
  }

  /**
   * Соединение с сервером расчетов.
   * @param {module:models.Server} serverModel
   */
  static connectToServer (serverModel) {
    const { id, reconnectTimeout } = serverModel
    if (this.clients.get(id)) {
      console.warn(`Сервер с id = ${id} уже имеет соединение`)
      return
    }
    const client = new Client({ serverModel })
    this.clients.set(id, client)
    client.on('ready', () => {
      this.allocateFreeNodes()
    })
    client.on('close', () => {
      console.log('Соединение закрыто')
      this.clients.delete(id)
      setTimeout(() => this.connectToServer(serverModel), reconnectTimeout * 1000)
    })
    // call destructor on disconnect
  }
}
