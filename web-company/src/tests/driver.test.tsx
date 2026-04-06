import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import DriverPage from '../pages/DriverPage'
import * as routesApi from '../api/routes'

vi.mock('../api/routes')

const ROUTE_ID = 'route-123'

const mockRoute = {
  id: ROUTE_ID,
  status: 'ACTIVE' as const,
  stopSequence: [
    { reportId: 'r1', reportIds: ['r1'], lat: 14.69, lng: -17.44, severity: 'HIGH', collected: false },
    { reportId: 'r2', reportIds: ['r2', 'r3'], lat: 14.70, lng: -17.45, severity: 'LOW', collected: false },
    { reportId: 'r4', reportIds: ['r4'], lat: 14.71, lng: -17.46, severity: 'MEDIUM', collected: true },
  ],
  totalDistanceKm: 3.2,
  estimatedDurationMin: 20,
  truckId: 't1',
  companyId: 'c1',
  createdAt: '2026-03-01T10:00:00Z',
}

function renderWithRoute(routeId = ROUTE_ID) {
  return render(
    <MemoryRouter initialEntries={[`/driver/${routeId}`]}>
      <Routes>
        <Route path="/driver/:routeId" element={<DriverPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('DriverPage — US-E09 driver interface', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders stop list with correct count', async () => {
    vi.spyOn(routesApi, 'getRoute').mockResolvedValue(mockRoute as any)
    renderWithRoute()
    expect(await screen.findByTestId('driver-page')).toBeInTheDocument()
    expect(await screen.findByText('1/3 stops completed')).toBeInTheDocument()
  })

  it('shows progress bar', async () => {
    vi.spyOn(routesApi, 'getRoute').mockResolvedValue(mockRoute as any)
    renderWithRoute()
    expect(await screen.findByTestId('progress-bar')).toBeInTheDocument()
  })

  it('renders all stop items', async () => {
    vi.spyOn(routesApi, 'getRoute').mockResolvedValue(mockRoute as any)
    renderWithRoute()
    expect(await screen.findByTestId('stop-item-0')).toBeInTheDocument()
    expect(await screen.findByTestId('stop-item-1')).toBeInTheDocument()
    expect(await screen.findByTestId('stop-item-2')).toBeInTheDocument()
  })

  it('shows collect button only for uncollected stops', async () => {
    vi.spyOn(routesApi, 'getRoute').mockResolvedValue(mockRoute as any)
    renderWithRoute()
    await screen.findByTestId('driver-page')
    expect(screen.getByTestId('btn-complete-0')).toBeInTheDocument()
    expect(screen.getByTestId('btn-complete-1')).toBeInTheDocument()
    expect(screen.queryByTestId('btn-complete-2')).not.toBeInTheDocument()
  })

  it('calls completeStop and updates route on button click', async () => {
    vi.spyOn(routesApi, 'getRoute').mockResolvedValue(mockRoute as any)
    const updatedRoute = {
      ...mockRoute,
      stopSequence: [
        { ...mockRoute.stopSequence[0], collected: true },
        ...mockRoute.stopSequence.slice(1),
      ],
    }
    vi.spyOn(routesApi, 'completeStop').mockResolvedValue(updatedRoute as any)

    renderWithRoute()
    await screen.findByTestId('btn-complete-0')
    fireEvent.click(screen.getByTestId('btn-complete-0'))

    await waitFor(() => {
      expect(routesApi.completeStop).toHaveBeenCalledWith(ROUTE_ID, 0)
    })
  })

  it('shows completion message when route is completed', async () => {
    const completedRoute = { ...mockRoute, status: 'COMPLETED' as const }
    vi.spyOn(routesApi, 'getRoute').mockResolvedValue(completedRoute as any)
    renderWithRoute()
    expect(await screen.findByTestId('completion-message')).toBeInTheDocument()
  })

  it('shows error when route fails to load', async () => {
    vi.spyOn(routesApi, 'getRoute').mockRejectedValue(new Error('Network error'))
    renderWithRoute()
    expect(await screen.findByText('Failed to load route. Please check your connection.')).toBeInTheDocument()
  })
})
