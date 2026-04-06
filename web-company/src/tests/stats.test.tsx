import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import StatsPage from '../pages/StatsPage'
import * as analyticsApi from '../api/analytics'
import * as authStore from '../store/authStore'

vi.mock('../api/analytics', async () => {
  const actual = await vi.importActual('../api/analytics')
  return {
    ...actual,
    getCompanyStats: vi.fn(),
  }
})
vi.mock('../store/authStore')

const COMPANY_ID = 'c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'

vi.spyOn(authStore, 'useAuthStore').mockImplementation((selector) =>
  selector({
    user: { id: COMPANY_ID, name: 'CleanCo', email: 'co@example.com', role: 'COMPANY', cityId: 'city-1' },
  } as unknown as Parameters<typeof selector>[0])
)

const mockStats = {
  period: 'week' as const,
  current: { totalReports: 50, collected: 35, pending: 15, collectionRate: 70, totalDistanceKm: 120.5 },
  previous: { totalReports: 40, collected: 28, pending: 12, collectionRate: 70, totalDistanceKm: 95 },
}

describe('StatsPage — US-E10 performance statistics', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders stats page with KPI grid', async () => {
    vi.spyOn(analyticsApi, 'getCompanyStats').mockResolvedValue(mockStats)
    render(<MemoryRouter><StatsPage /></MemoryRouter>)
    expect(await screen.findByTestId('kpi-grid')).toBeInTheDocument()
  })

  it('fetches stats with default week period', async () => {
    vi.spyOn(analyticsApi, 'getCompanyStats').mockResolvedValue(mockStats)
    render(<MemoryRouter><StatsPage /></MemoryRouter>)
    await waitFor(() => {
      expect(analyticsApi.getCompanyStats).toHaveBeenCalledWith(COMPANY_ID, 'week')
    })
  })

  it('shows correct KPI values', async () => {
    vi.spyOn(analyticsApi, 'getCompanyStats').mockResolvedValue(mockStats)
    render(<MemoryRouter><StatsPage /></MemoryRouter>)
    expect(await screen.findByTestId('kpi-total-reports')).toHaveTextContent('50')
    expect(await screen.findByTestId('kpi-collected')).toHaveTextContent('35')
    expect(await screen.findByTestId('kpi-collection-rate')).toHaveTextContent('70')
  })

  it('refetches when period changes', async () => {
    vi.spyOn(analyticsApi, 'getCompanyStats').mockResolvedValue(mockStats)
    render(<MemoryRouter><StatsPage /></MemoryRouter>)
    await screen.findByTestId('kpi-grid')

    fireEvent.click(screen.getByTestId('period-month'))

    await waitFor(() => {
      expect(analyticsApi.getCompanyStats).toHaveBeenCalledWith(COMPANY_ID, 'month')
    })
  })

  it('shows comparison table', async () => {
    vi.spyOn(analyticsApi, 'getCompanyStats').mockResolvedValue(mockStats)
    render(<MemoryRouter><StatsPage /></MemoryRouter>)
    expect(await screen.findByTestId('comparison-table')).toBeInTheDocument()
  })

  it('shows error when fetch fails', async () => {
    vi.spyOn(analyticsApi, 'getCompanyStats').mockRejectedValue(new Error('Network error'))
    render(<MemoryRouter><StatsPage /></MemoryRouter>)
    expect(await screen.findByText('Failed to load statistics.')).toBeInTheDocument()
  })
})
