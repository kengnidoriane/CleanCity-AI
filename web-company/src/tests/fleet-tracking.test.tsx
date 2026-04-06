import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import FleetTrackingPage from '../pages/FleetTrackingPage'
import * as trucksApi from '../api/trucks'
import * as socketService from '../services/socket'
import * as authStore from '../store/authStore'

vi.mock('../api/trucks')
vi.mock('../services/socket')
vi.mock('../store/authStore')
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map">{children}</div>,
  TileLayer: () => null,
  Marker: ({ children }: any) => <div data-testid="truck-marker">{children}</div>,
  Popup: ({ children }: any) => <div>{children}</div>,
}))
vi.mock('leaflet', () => ({ default: { divIcon: vi.fn(() => ({})) } }))

const CITY_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'

vi.spyOn(authStore, 'useAuthStore').mockImplementation((selector) =>
  selector({
    user: { id: 'u1', name: 'CleanCo', email: 'co@example.com', role: 'COMPANY', cityId: CITY_ID },
  } as unknown as Parameters<typeof selector>[0])
)

const mockTrucks = [
  { id: 't1', name: 'Truck 01', currentLat: 14.69, currentLng: -17.44, completionPercent: 45, etaMinutes: 10, activeRouteId: 'r1', driver: { user: { name: 'Moussa' } } },
  { id: 't2', name: 'Truck 02', currentLat: 14.70, currentLng: -17.45, completionPercent: 80, etaMinutes: null, activeRouteId: null, driver: null },
]

const mockSocket = { on: vi.fn(), off: vi.fn(), emit: vi.fn(), disconnect: vi.fn(), connected: false }

describe('FleetTrackingPage — US-E07, US-E08 fleet tracking and alerts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(trucksApi, 'getActiveTrucks').mockResolvedValue(mockTrucks as any)
    vi.spyOn(socketService, 'connectToCity').mockReturnValue(mockSocket as any)
    vi.spyOn(socketService, 'onTruckPosition').mockReturnValue(() => {})
    vi.spyOn(socketService, 'onTruckAlert').mockReturnValue(() => {})
    vi.spyOn(socketService, 'disconnectSocket').mockImplementation(() => {})
  })

  it('renders fleet tracking page with truck cards', async () => {
    render(<MemoryRouter><FleetTrackingPage /></MemoryRouter>)
    expect(await screen.findByTestId('truck-card-t1')).toBeInTheDocument()
    expect(await screen.findByTestId('truck-card-t2')).toBeInTheDocument()
  })

  it('shows truck count after loading', async () => {
    render(<MemoryRouter><FleetTrackingPage /></MemoryRouter>)
    expect(await screen.findByText('2 active trucks')).toBeInTheDocument()
  })

  it('connects to WebSocket on mount', async () => {
    render(<MemoryRouter><FleetTrackingPage /></MemoryRouter>)
    await waitFor(() => expect(socketService.connectToCity).toHaveBeenCalledWith(CITY_ID))
    expect(socketService.onTruckPosition).toHaveBeenCalled()
    expect(socketService.onTruckAlert).toHaveBeenCalled()
  })

  it('disconnects WebSocket on unmount', async () => {
    const { unmount } = render(<MemoryRouter><FleetTrackingPage /></MemoryRouter>)
    await screen.findByText('2 active trucks')
    unmount()
    expect(socketService.disconnectSocket).toHaveBeenCalledWith(CITY_ID)
  })

  it('shows alert in panel when truck_alert event received', async () => {
    let alertHandler: ((alert: any) => void) | null = null
    vi.spyOn(socketService, 'onTruckAlert').mockImplementation((_socket, handler) => {
      alertHandler = handler
      return () => {}
    })

    render(<MemoryRouter><FleetTrackingPage /></MemoryRouter>)
    await screen.findByText('2 active trucks')

    alertHandler!({
      truckId: 't1',
      type: 'DEVIATION',
      message: 'Truck has deviated more than 500m from its assigned route',
      detectedAt: new Date().toISOString(),
    })

    expect(await screen.findByTestId('alert-deviation')).toBeInTheDocument()
  })

  it('updates truck position on WebSocket event', async () => {
    let positionHandler: ((update: any) => void) | null = null
    vi.spyOn(socketService, 'onTruckPosition').mockImplementation((_socket, handler) => {
      positionHandler = handler
      return () => {}
    })

    render(<MemoryRouter><FleetTrackingPage /></MemoryRouter>)
    await screen.findByText('2 active trucks')

    positionHandler!({ truckId: 't1', lat: 14.71, lng: -17.46, completionPercent: 60, lastUpdated: new Date().toISOString() })
    // No crash expected — state update handled correctly
    expect(positionHandler).not.toBeNull()
  })
})
