import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ReportsMapPage from '../pages/ReportsMapPage'
import * as reportsApi from '../api/reports'
import * as authStore from '../store/authStore'

vi.mock('../api/reports')
vi.mock('../store/authStore')
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => null,
  CircleMarker: ({ children, eventHandlers }: any) => (
    <div data-testid="circle-marker" onClick={eventHandlers?.click}>{children}</div>
  ),
  Popup: ({ children }: any) => <div>{children}</div>,
}))

const CITY_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'

vi.spyOn(authStore, 'useAuthStore').mockImplementation((selector) =>
  selector({
    user: { id: 'u1', name: 'CleanCo', email: 'co@example.com', role: 'COMPANY', cityId: CITY_ID },
  } as unknown as Parameters<typeof selector>[0])
)

const mockReports = [
  { id: 'r1', latitude: 14.69, longitude: -17.44, wasteType: 'PLASTIC', severity: 'HIGH', status: 'PENDING', photoUrl: '', companyId: null, createdAt: '2026-03-01T10:00:00Z', collectedAt: null },
  { id: 'r2', latitude: 14.70, longitude: -17.45, wasteType: 'ORGANIC', severity: 'LOW', status: 'COLLECTED', photoUrl: '', companyId: 'c1', createdAt: '2026-03-02T10:00:00Z', collectedAt: '2026-03-03T10:00:00Z' },
]

describe('ReportsMapPage — US-E02 reports map dashboard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders map and filter panel', async () => {
    vi.spyOn(reportsApi, 'getCityReports').mockResolvedValue(mockReports as any)
    render(<MemoryRouter><ReportsMapPage /></MemoryRouter>)
    expect(await screen.findByTestId('reports-map-page')).toBeInTheDocument()
    expect(screen.getAllByTestId('map-container').length).toBeGreaterThan(0)
  })

  it('fetches reports with cityId on mount', async () => {
    vi.spyOn(reportsApi, 'getCityReports').mockResolvedValue(mockReports as any)
    render(<MemoryRouter><ReportsMapPage /></MemoryRouter>)
    await waitFor(() => {
      expect(reportsApi.getCityReports).toHaveBeenCalledWith(CITY_ID, {})
    })
  })

  it('shows report count after loading', async () => {
    vi.spyOn(reportsApi, 'getCityReports').mockResolvedValue(mockReports as any)
    render(<MemoryRouter><ReportsMapPage /></MemoryRouter>)
    expect(await screen.findByText('2 reports')).toBeInTheDocument()
  })

  it('applies status filter and refetches', async () => {
    vi.spyOn(reportsApi, 'getCityReports').mockResolvedValue(mockReports as any)
    render(<MemoryRouter><ReportsMapPage /></MemoryRouter>)
    await screen.findByText('2 reports')

    fireEvent.change(screen.getByTestId('filter-status'), { target: { value: 'PENDING' } })

    await waitFor(() => {
      expect(reportsApi.getCityReports).toHaveBeenCalledWith(CITY_ID, { status: 'PENDING' })
    })
  })

  it('resets filters when reset button is clicked', async () => {
    vi.spyOn(reportsApi, 'getCityReports').mockResolvedValue(mockReports as any)
    render(<MemoryRouter><ReportsMapPage /></MemoryRouter>)
    await screen.findByText('2 reports')

    fireEvent.change(screen.getByTestId('filter-status'), { target: { value: 'PENDING' } })
    await screen.findByTestId('btn-reset-filters')
    fireEvent.click(screen.getByTestId('btn-reset-filters'))

    await waitFor(() => {
      expect(reportsApi.getCityReports).toHaveBeenLastCalledWith(CITY_ID, {})
    })
  })
})
