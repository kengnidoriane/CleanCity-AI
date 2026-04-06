import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HotspotMapPage from '../pages/HotspotMapPage'
import * as hotspotsApi from '../api/hotspots'
import * as authStore from '../store/authStore'

vi.mock('../api/hotspots', async () => {
  const actual = await vi.importActual('../api/hotspots')
  return { ...actual, getHotspots: vi.fn() }
})
vi.mock('../store/authStore')

// Leaflet requires a DOM environment — mock MapContainer and related components
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="leaflet-map">{children}</div>
  ),
  TileLayer: () => null,
  CircleMarker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="circle-marker">{children}</div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popup">{children}</div>
  ),
}))

const CITY_ID = 'city-abc-123'

vi.spyOn(authStore, 'useAuthStore').mockImplementation((selector) =>
  selector({
    user: { id: 'u1', name: 'City Admin', email: 'admin@city.gov', role: 'MUNICIPAL', cityId: CITY_ID },
  } as unknown as Parameters<typeof selector>[0])
)

const mockHotspots = [
  { lat: 14.69, lng: -17.44, count: 8, intensity: 0.9 },
  { lat: 14.71, lng: -17.46, count: 3, intensity: 0.4 },
  { lat: 14.68, lng: -17.43, count: 1, intensity: 0.1 },
]

describe('HotspotMapPage — US-M03 waste hotspot map', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the map container and sidebar', async () => {
    vi.spyOn(hotspotsApi, 'getHotspots').mockResolvedValue(mockHotspots)
    render(<MemoryRouter><HotspotMapPage /></MemoryRouter>)
    expect(await screen.findByTestId('hotspot-map-page')).toBeInTheDocument()
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
    expect(screen.getByTestId('leaflet-map')).toBeInTheDocument()
  })

  it('fetches hotspots with default 7days period and cityId', async () => {
    vi.spyOn(hotspotsApi, 'getHotspots').mockResolvedValue(mockHotspots)
    render(<MemoryRouter><HotspotMapPage /></MemoryRouter>)
    await waitFor(() => {
      expect(hotspotsApi.getHotspots).toHaveBeenCalledWith(CITY_ID, '7days')
    })
  })

  it('renders a CircleMarker for each hotspot', async () => {
    vi.spyOn(hotspotsApi, 'getHotspots').mockResolvedValue(mockHotspots)
    render(<MemoryRouter><HotspotMapPage /></MemoryRouter>)
    const markers = await screen.findAllByTestId('circle-marker')
    expect(markers).toHaveLength(mockHotspots.length)
  })

  it('refetches when period changes', async () => {
    vi.spyOn(hotspotsApi, 'getHotspots').mockResolvedValue(mockHotspots)
    render(<MemoryRouter><HotspotMapPage /></MemoryRouter>)
    await screen.findAllByTestId('circle-marker')

    fireEvent.click(screen.getByTestId('period-30days'))

    await waitFor(() => {
      expect(hotspotsApi.getHotspots).toHaveBeenCalledWith(CITY_ID, '30days')
    })
  })

  it('shows error message when fetch fails', async () => {
    vi.spyOn(hotspotsApi, 'getHotspots').mockRejectedValue(new Error('Network error'))
    render(<MemoryRouter><HotspotMapPage /></MemoryRouter>)
    expect(await screen.findByText('Failed to load hotspot data.')).toBeInTheDocument()
  })

  it('shows empty state when no hotspots found', async () => {
    vi.spyOn(hotspotsApi, 'getHotspots').mockResolvedValue([])
    render(<MemoryRouter><HotspotMapPage /></MemoryRouter>)
    expect(await screen.findByText('No hotspots found')).toBeInTheDocument()
  })

  it('displays summary stats when hotspots are loaded', async () => {
    vi.spyOn(hotspotsApi, 'getHotspots').mockResolvedValue(mockHotspots)
    render(<MemoryRouter><HotspotMapPage /></MemoryRouter>)
    // total reports = 8 + 3 + 1 = 12
    expect(await screen.findByText('12')).toBeInTheDocument()
    // high-risk zones (intensity >= 0.7) = 1
    expect(screen.getByText('1')).toBeInTheDocument()
  })
})
