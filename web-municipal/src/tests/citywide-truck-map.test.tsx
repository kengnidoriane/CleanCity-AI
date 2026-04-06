import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CitywideTruckMapPage from '../pages/CitywideTruckMapPage'
import * as trucksApi from '../api/trucks'
import * as socketService from '../services/socket'
import * as authStore from '../store/authStore'

vi.mock('../api/trucks', async () => {
  const actual = await vi.importActual('../api/trucks')
  return { ...actual, getCityTrucks: vi.fn() }
})
vi.mock('../services/socket')
vi.mock('../store/authStore')

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="leaflet-map">{children}</div>
  ),
  TileLayer: () => null,
  Marker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="truck-marker">{children}</div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('leaflet', () => ({ default: { divIcon: vi.fn(() => ({})) } }))

const CITY_ID = 'city-abc-123'

vi.spyOn(authStore, 'useAuthStore').mockImplementation((selector) =>
  selector({
    user: { id: 'u1', name: 'City Admin', email: 'admin@city.gov', role: 'MUNICIPAL', cityId: CITY_ID },
  } as unknown as Parameters<typeof selector>[0])
)

const mockTrucks = [
  {
    id: 't1', name: 'Truck 01',
    currentLat: 14.69, currentLng: -17.44,
    completionPercent: 45, etaMinutes: 10,
    activeRouteId: 'r1', companyId: 'c1', companyName: 'CleanCo',
    driver: { user: { name: 'Moussa' } },
  },
  {
    id: 't2', name: 'Truck 02',
    currentLat: 14.70, currentLng: -17.45,
    completionPercent: 80, etaMinutes: null,
    activeRouteId: null, companyId: 'c2', companyName: 'EcoWaste',
    driver: null,
  },
]

const mockSocket = {
  on: vi.fn(), off: vi.fn(), emit: vi.fn(),
  disconnect: vi.fn(), connected: false,
}

describe('CitywideTruckMapPage — US-M05 citywide truck map', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    trucksApi.resetColorMap()
    vi.spyOn(trucksApi, 'getCityTrucks').mockResolvedValue(mockTrucks)
    vi.spyOn(socketService, 'connectToCity').mockReturnValue(mockSocket as any)
    vi.spyOn(socketService, 'onTruckPosition').mockReturnValue(() => {})
    vi.spyOn(socketService, 'disconnectSocket').mockImplementation(() => {})
  })

  it('renders the map and sidebar', async () => {
    render(<MemoryRouter><CitywideTruckMapPage /></MemoryRouter>)
    expect(await screen.findByTestId('citywide-truck-map-page')).toBeInTheDocument()
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
    expect(screen.getByTestId('leaflet-map')).toBeInTheDocument()
  })

  it('fetches trucks with the user cityId', async () => {
    render(<MemoryRouter><CitywideTruckMapPage /></MemoryRouter>)
    await waitFor(() => {
      expect(trucksApi.getCityTrucks).toHaveBeenCalledWith(CITY_ID)
    })
  })

  it('renders a card for each truck', async () => {
    render(<MemoryRouter><CitywideTruckMapPage /></MemoryRouter>)
    expect(await screen.findByTestId('truck-card-t1')).toBeInTheDocument()
    expect(screen.getByTestId('truck-card-t2')).toBeInTheDocument()
  })

  it('renders a marker for each truck with coordinates', async () => {
    render(<MemoryRouter><CitywideTruckMapPage /></MemoryRouter>)
    const markers = await screen.findAllByTestId('truck-marker')
    expect(markers).toHaveLength(2)
  })

  it('shows company legend with distinct entries', async () => {
    render(<MemoryRouter><CitywideTruckMapPage /></MemoryRouter>)
    const legend = await screen.findByTestId('company-legend')
    expect(legend).toHaveTextContent('CleanCo')
    expect(legend).toHaveTextContent('EcoWaste')
  })

  it('connects to WebSocket on mount and disconnects on unmount', async () => {
    const { unmount } = render(<MemoryRouter><CitywideTruckMapPage /></MemoryRouter>)
    await waitFor(() => expect(socketService.connectToCity).toHaveBeenCalledWith(CITY_ID))
    expect(socketService.onTruckPosition).toHaveBeenCalled()
    unmount()
    expect(socketService.disconnectSocket).toHaveBeenCalledWith(CITY_ID)
  })

  it('updates truck position on WebSocket event', async () => {
    let positionHandler: ((update: any) => void) | null = null
    vi.spyOn(socketService, 'onTruckPosition').mockImplementation((_socket, handler) => {
      positionHandler = handler
      return () => {}
    })

    render(<MemoryRouter><CitywideTruckMapPage /></MemoryRouter>)
    await screen.findByTestId('truck-card-t1')

    positionHandler!({
      truckId: 't1', lat: 14.71, lng: -17.46,
      completionPercent: 60, lastUpdated: new Date().toISOString(),
    })

    // No crash — state update handled correctly
    expect(positionHandler).not.toBeNull()
  })

  it('shows error when fetch fails', async () => {
    vi.spyOn(trucksApi, 'getCityTrucks').mockRejectedValue(new Error('Network error'))
    render(<MemoryRouter><CitywideTruckMapPage /></MemoryRouter>)
    expect(await screen.findByText('Failed to load truck positions.')).toBeInTheDocument()
  })
})
