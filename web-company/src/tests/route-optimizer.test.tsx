import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import RouteOptimizerPage from '../pages/RouteOptimizerPage'
import * as reportsApi from '../api/reports'
import * as routesApi from '../api/routes'
import * as trucksApi from '../api/trucks'
import * as authStore from '../store/authStore'

vi.mock('../api/reports')
vi.mock('../api/routes')
vi.mock('../api/trucks')
vi.mock('../store/authStore')
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map">{children}</div>,
  TileLayer: () => null,
  CircleMarker: ({ children }: any) => <div>{children}</div>,
  Polyline: () => null,
  Tooltip: ({ children }: any) => <div>{children}</div>,
}))

const CITY_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'

vi.spyOn(authStore, 'useAuthStore').mockImplementation((selector) =>
  selector({
    user: { id: 'u1', name: 'CleanCo', email: 'co@example.com', role: 'COMPANY', cityId: CITY_ID },
  } as unknown as Parameters<typeof selector>[0])
)

const mockReports = [
  { id: 'r1', latitude: 14.69, longitude: -17.44, wasteType: 'PLASTIC', severity: 'HIGH', status: 'PENDING', photoUrl: '', companyId: null, createdAt: '2026-03-01T10:00:00Z', collectedAt: null },
  { id: 'r2', latitude: 14.70, longitude: -17.45, wasteType: 'ORGANIC', severity: 'LOW', status: 'PENDING', photoUrl: '', companyId: null, createdAt: '2026-03-02T10:00:00Z', collectedAt: null },
]

const mockTrucks = [
  { id: 't1', name: 'Truck 01', currentLat: 14.69, currentLng: -17.44, completionPercent: 0, etaMinutes: null, activeRouteId: null, driver: { user: { name: 'Moussa' } } },
]

const mockRoute = {
  id: 'route-1',
  status: 'DRAFT' as const,
  stopSequence: [
    { reportId: 'r1', reportIds: ['r1'], lat: 14.69, lng: -17.44, severity: 'HIGH', collected: false },
    { reportId: 'r2', reportIds: ['r2'], lat: 14.70, lng: -17.45, severity: 'LOW', collected: false },
  ],
  totalDistanceKm: 2.5,
  estimatedDurationMin: 15,
  truckId: null,
  companyId: 'c1',
  createdAt: '2026-03-01T10:00:00Z',
}

describe('RouteOptimizerPage — US-E04, US-E05, US-E06', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(reportsApi, 'getCityReports').mockResolvedValue(mockReports as any)
    vi.spyOn(trucksApi, 'getActiveTrucks').mockResolvedValue(mockTrucks as any)
  })

  it('renders optimize button and report count', async () => {
    render(<MemoryRouter><RouteOptimizerPage /></MemoryRouter>)
    expect(await screen.findByTestId('btn-optimize')).toBeInTheDocument()
    expect(await screen.findByText('2 pending reports · 1 trucks available')).toBeInTheDocument()
  })

  it('calls optimizeRoute with correct stops on button click', async () => {
    vi.spyOn(routesApi, 'optimizeRoute').mockResolvedValue(mockRoute as any)
    vi.spyOn(routesApi, 'buildOptimizeInput').mockReturnValue({
      cityId: CITY_ID,
      reportIds: ['r1', 'r2'],
      stops: [
        { reportId: 'r1', lat: 14.69, lng: -17.44, severity: 'HIGH' },
        { reportId: 'r2', lat: 14.70, lng: -17.45, severity: 'LOW' },
      ],
    })
    render(<MemoryRouter><RouteOptimizerPage /></MemoryRouter>)
    await screen.findByText('2 pending reports · 1 trucks available')

    fireEvent.click(screen.getByTestId('btn-optimize'))

    await waitFor(() => {
      expect(routesApi.optimizeRoute).toHaveBeenCalledWith(
        expect.objectContaining({
          cityId: CITY_ID,
          reportIds: ['r1', 'r2'],
        })
      )
    })
  })

  it('shows route result with distance and stops after optimization', async () => {
    vi.spyOn(routesApi, 'optimizeRoute').mockResolvedValue(mockRoute as any)
    render(<MemoryRouter><RouteOptimizerPage /></MemoryRouter>)
    await screen.findByText('2 pending reports · 1 trucks available')

    fireEvent.click(screen.getByTestId('btn-optimize'))

    expect(await screen.findByTestId('route-result')).toBeInTheDocument()
    expect(await screen.findByText('2.5 km')).toBeInTheDocument()
  })

  it('assigns route to selected truck', async () => {
    vi.spyOn(routesApi, 'optimizeRoute').mockResolvedValue(mockRoute as any)
    vi.spyOn(routesApi, 'assignRoute').mockResolvedValue({ ...mockRoute, status: 'ACTIVE', truckId: 't1' } as any)

    render(<MemoryRouter><RouteOptimizerPage /></MemoryRouter>)
    await screen.findByText('2 pending reports · 1 trucks available')

    fireEvent.click(screen.getByTestId('btn-optimize'))
    await screen.findByTestId('route-result')

    fireEvent.change(screen.getByTestId('select-truck'), { target: { value: 't1' } })
    fireEvent.click(screen.getByTestId('btn-assign'))

    await waitFor(() => {
      expect(routesApi.assignRoute).toHaveBeenCalledWith('route-1', 't1')
    })
    expect(await screen.findByTestId('success-message')).toBeInTheDocument()
  })

  it('shows error when optimization fails', async () => {
    vi.spyOn(routesApi, 'optimizeRoute').mockRejectedValue(new Error('AI service down'))
    render(<MemoryRouter><RouteOptimizerPage /></MemoryRouter>)
    await screen.findByText('2 pending reports · 1 trucks available')

    fireEvent.click(screen.getByTestId('btn-optimize'))

    expect(await screen.findByTestId('error-message')).toBeInTheDocument()
  })
})
