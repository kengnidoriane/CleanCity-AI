import { io, type Socket } from 'socket.io-client'
import type { TruckPositionUpdate } from '../api/trucks'

const API_URL = process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3000'

let _socket: Socket | null = null

/**
 * Connect to the backend WebSocket and join the city room.
 * Returns the socket instance for event subscription.
 */
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

/**
 * Subscribe to real-time truck position updates for a city.
 * Returns an unsubscribe function for cleanup.
 */
export function onTruckPosition(
  socket: Socket,
  handler: (update: TruckPositionUpdate) => void
): () => void {
  socket.on('truck_position', handler)
  return () => socket.off('truck_position', handler)
}

/**
 * Disconnect and clean up the socket connection.
 */
export function disconnectSocket(cityId: string): void {
  if (_socket) {
    _socket.emit('leave_city', cityId)
    _socket.disconnect()
    _socket = null
  }
}
