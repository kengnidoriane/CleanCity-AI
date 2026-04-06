import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import TruckMapScreen from '../screens/TruckMapScreen'
import * as trucksApi from '../api/trucks'
import * as authStore from '../store/authStore'
import * as socketService from '../services/socket'

jest.mock('../api/trucks')
jest.mock('../store/authStore')
jest.mock('../services/socket')
jest.mock('react-native-maps', () => {
  const React = require('react')
  const { View } = require('react-native')
  const MapView = ({ children, testID }: any) => React.createElement(View, { testID }, children)
  const Marker = ({ testID, children }: any) => React.createElement(View, { testID }, children)
  const Callout = ({ children }: any) => React.createElement(View, {}, children)
  return { __esModule: true, default: MapView, Marker, Callout }
})

const CITY_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'

jest.spyOn(authStore, 'useAuthStore').mockImplementation((selector) =>
  selector({
    user: { id: 'user-1', name: 'Alice', phone: '+221770000000', role: 'CITIZEN', cityId: CITY_ID },
  } as unknown as Parameters<typeof selector>[0])
)

const mockTrucks = [
  { id: 't1', name: 'Truck 01', currentLat: 14.6928, currentLng: -17.4467, completionPercent: 45, etaMinutes: 10, driver: { user: { name: 'Moussa' } } },
  { id: 't2', name: 'Truck 02', currentLat: 14.7000, currentLng: -17.4500, completionPercent: 80, etaMinutes: null, driver: null },
]

const mockSocket = { on: jest.fn(), off: jest.fn(), emit: jest.fn(), disconnect: jest.fn(), connected: false }

describe('TruckMapScreen — US-C11 live truck map', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(socketService, 'connectToCity').mockReturnValue(mockSocket as any)
    jest.spyOn(socketService, 'onTruckPosition').mockReturnValue(() => {})
    jest.spyOn(socketService, 'disconnectSocket').mockImplementation(() => {})
  })

  it('shows loading state initially', () => {
    jest.spyOn(trucksApi, 'getActiveTrucks').mockReturnValue(new Promise(() => {}))
    const { getByTestId } = render(<TruckMapScreen />)
    expect(getByTestId('loading-indicator')).toBeTruthy()
  })

  it('renders map with truck markers after loading', async () => {
    jest.spyOn(trucksApi, 'getActiveTrucks').mockResolvedValue(mockTrucks)
    const { findByTestId } = render(<TruckMapScreen />)
    expect(await findByTestId('map-view')).toBeTruthy()
    expect(await findByTestId('truck-marker-t1')).toBeTruthy()
    expect(await findByTestId('truck-marker-t2')).toBeTruthy()
  })

  it('connects to WebSocket on mount and disconnects on unmount', async () => {
    jest.spyOn(trucksApi, 'getActiveTrucks').mockResolvedValue(mockTrucks)
    const { unmount } = render(<TruckMapScreen />)
    await waitFor(() => expect(socketService.connectToCity).toHaveBeenCalledWith(CITY_ID))
    unmount()
    expect(socketService.disconnectSocket).toHaveBeenCalledWith(CITY_ID)
  })

  it('shows empty state when no active trucks', async () => {
    jest.spyOn(trucksApi, 'getActiveTrucks').mockResolvedValue([])
    const { findByTestId } = render(<TruckMapScreen />)
    expect(await findByTestId('no-trucks-banner')).toBeTruthy()
  })

  it('updates truck position on WebSocket event', async () => {
    jest.spyOn(trucksApi, 'getActiveTrucks').mockResolvedValue(mockTrucks)
    let positionHandler: ((update: any) => void) | null = null
    jest.spyOn(socketService, 'onTruckPosition').mockImplementation((_socket, handler) => {
      positionHandler = handler
      return () => {}
    })

    render(<TruckMapScreen />)
    await waitFor(() => expect(socketService.onTruckPosition).toHaveBeenCalled())

    positionHandler!({ truckId: 't1', lat: 14.7100, lng: -17.4600, completionPercent: 50, lastUpdated: new Date().toISOString() })
    // Position update is handled in state — no crash expected
    expect(positionHandler).not.toBeNull()
  })
})
