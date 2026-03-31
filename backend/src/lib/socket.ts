import { Server } from 'socket.io'
import type { Server as HttpServer } from 'http'

let _io: Server | null = null

export function initSocket(httpServer: HttpServer) {
  _io = new Server(httpServer, {
    cors: { origin: '*' },
  })
  return _io
}

export function getIO(): Server {
  if (!_io) throw new Error('Socket.io not initialized')
  return _io
}
