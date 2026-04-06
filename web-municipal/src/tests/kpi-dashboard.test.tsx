import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import KpiDashboardPage from '../pages/KpiDashboardPage'
import * as analyticsApi from '../api/analytics'
import * as authStore from '../store/authStore'

vi.mock('../api/analytics', async () => {
  const actual = await vi.importActual('../api/analytics')
  return { ...actual, getCityKpis: vi.fn() }
})
vi.mock('../store/authStore')

const CITY_ID = 'city-abc-123'

vi.spyOn(authStore, 'useAuthStore').mockImplementation((selector) =>
  selector({
    user: { id: 'u1', name: 'City Admin', email: 'admin@city.gov', role: 'MUNICIPAL', cityId: CITY_ID },
  } as unknown as Parameters<typeof selector>[0])
)

const mockKpis = {
  totalActiveReports: 142,
  collectionRate: 78,
  activeTrucks: 12,
  avgResponseTimeMin: 35,
}

describe('KpiDashboardPage — US-M02 city KPI dashboard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders all 4 KPI cards', async () => {
    vi.spyOn(analyticsApi, 'getCityKpis').mockResolvedValue(mockKpis)
    render(<MemoryRouter><KpiDashboardPage /></MemoryRouter>)
    expect(await screen.findByTestId('kpi-grid')).toBeInTheDocument()
    expect(screen.getByTestId('kpi-active-reports')).toBeInTheDocument()
    expect(screen.getByTestId('kpi-collection-rate')).toBeInTheDocument()
    expect(screen.getByTestId('kpi-active-trucks')).toBeInTheDocument()
    expect(screen.getByTestId('kpi-avg-response-time')).toBeInTheDocument()
  })

  it('displays correct KPI values', async () => {
    vi.spyOn(analyticsApi, 'getCityKpis').mockResolvedValue(mockKpis)
    render(<MemoryRouter><KpiDashboardPage /></MemoryRouter>)
    expect(await screen.findByTestId('kpi-active-reports')).toHaveTextContent('142')
    expect(screen.getByTestId('kpi-collection-rate')).toHaveTextContent('78')
    expect(screen.getByTestId('kpi-active-trucks')).toHaveTextContent('12')
    expect(screen.getByTestId('kpi-avg-response-time')).toHaveTextContent('35')
  })

  it('fetches KPIs with the user cityId', async () => {
    vi.spyOn(analyticsApi, 'getCityKpis').mockResolvedValue(mockKpis)
    render(<MemoryRouter><KpiDashboardPage /></MemoryRouter>)
    await waitFor(() => {
      expect(analyticsApi.getCityKpis).toHaveBeenCalledWith(CITY_ID)
    })
  })

  it('shows error when fetch fails', async () => {
    vi.spyOn(analyticsApi, 'getCityKpis').mockRejectedValue(new Error('Network error'))
    render(<MemoryRouter><KpiDashboardPage /></MemoryRouter>)
    expect(await screen.findByText('Failed to load city KPIs.')).toBeInTheDocument()
  })
})
