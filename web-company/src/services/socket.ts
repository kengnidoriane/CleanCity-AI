import { io, type Socket } from 'socket.io-client'

const API_URL = import.meta.env['VITE_API_URL'] ?? 'http://localhost:3000'

let _socket: Socket | null = null

export interface TruckPositionUpdate {
  truckId: string
  lat: number
  lng: number
  completionPercent: number
  lastUpdated: string
}

export interface TruckAlert {
  truckId: string
  type: 'DEVIATION' | 'IDLE'
  message: string
  detectedAt: string
}

export function connectToCity(cityId: string): Socket {
  if (_socket?.connected) {
    _socket.emit('join_city', cityId)
    return _socket
  }

  _socket = io(API_URL, { transports: ['websocket'], autoConnect: true })

  _socket.on('connect', () => {
    _socket!.emit('join_city', cityId)
  })

  return _socket
}

export function onTruckPosition(
  socket: Socket,
  handler: (update: TruckPositionUpdate) => void
): () => void {
  socket.on('truck_position', handler)
  return () => socket.off('truck_position', handler)
}

export function onTruckAlert(
  socket: Socket,
  handler: (alert: TruckAlert) => void
): () => void {
  socket.on('truck_alert', handler)
  return () => socket.off('truck_alert', handler)
}

export function disconnectSocket(cityId: string): void {
  if (_socket) {
    _socket.emit('leave_city', cityId)
    _socket.disconnect()
    _socket = null
  }
}
