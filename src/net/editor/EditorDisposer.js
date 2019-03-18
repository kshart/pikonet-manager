import http from 'http'
import { server as WebSocketServer } from 'websocket'
import EditorClient from './EditorClient'

export default class EditorDisposer {
  /**
   * Открытые сокеты соединений с серверами вычислений.
   * @type {Map<object>}
   */
  static clients = new Map()

  /**
   * Клиенты для каналов
   * @deprecated Промежуточное решение
   * @type {Map<Array<EditorClient>>}
   */
  static channelClients = new Map()

  /**
   * @deprecated Промежуточное решение
   * @param {EditorClient} client клиент
   * @param {String} channel имя канала
   */
  static addChannelWatcher (client, channel) {
    console.log('addChannelWatcher')
    if (!this.channelClients.has(channel)) {
      this.channelClients.set(channel, [])
    }
    const clients = this.channelClients.get(channel)
    if (!clients.includes(client)) {
      clients.push(client)
    }
    console.log(Array.from(this.channelClients))
  }

  /**
   * @deprecated Промежуточное решение
   * @param {EditorClient} client клиент
   * @param {String} channel имя канала
   */
  static removeChannelWatcher (client, channel) {
    console.log('removeChannelWatcher')
    if (!this.channelClients.has(channel)) {
      return
    }
    const clients = this.channelClients.get(channel)

    const index = clients.indexOf(client)
    if (index < 0) {
      return
    }
    clients.splice(index, 1)
    if (clients.length <= 0) {
      this.channelClients.delete(channel)
    }
  }

  static init () {
    const httpServer = http.createServer((request, response) => {})
    httpServer.listen(1069, () => {})
    const wsServer = new WebSocketServer({ httpServer })
    wsServer.on('request', request => {
      const wSocket = request.accept(null, request.origin)
      const editorClient = new EditorClient({ request, wSocket })
      wSocket.on('message', message => {
        if (message.type !== 'utf8') {
          console.error('Сообщение не utf8')
          return
        }
        try {
          const request = JSON.parse(message.utf8Data)
          editorClient.handleRequest(request)
        } catch (error) {
          console.log(message.utf8Data)
          console.error(error)
          editorClient.send('error')
        }
      })
      wSocket.on('close', connection => {
        console.log(`close ws ${request.origin}`)
        const client = this.clients.get(request.origin)
        if (!client) {
          return
        }
        this.clients.delete(request.origin)
        client.destructor()
      })
      this.clients.set(request.origin, editorClient)
    })
    console.log('start web server')
  }
}
