import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CompanyPerformancePage from '../pages/CompanyPerformancePage'
import * as companiesApi from '../api/companies'
import * as authStore from '../store/authStore'

vi.mock('../api/companies', async () => {
  const actual = await vi.importActual('../api/companies')
  return { ...actual, getCompanyPerformance: vi.fn() }
})
vi.mock('../store/authStore')

const CITY_ID = 'city-abc-123'

vi.spyOn(authStore, 'useAuthStore').mockImplementation((selector) =>
  selector({
    user: { id: 'u1', name: 'City Admin', email: 'admin@city.gov', role: 'MUNICIPAL', cityId: CITY_ID },
  } as unknown as Parameters<typeof selector>[0])
)

const mockCompanies = [
  { id: 'c1', name: 'CleanCo', totalReports: 50, collected: 40, collectionRate: 80, activeTrucks: 3, avgResponseTimeMin: 30 },
  { id: 'c2', name: 'EcoWaste', totalReports: 30, collected: 15, collectionRate: 50, activeTrucks: 2, avgResponseTimeMin: 60 },
  { id: 'c3', name: 'GreenFleet', totalReports: 20, collected: 18, collectionRate: 90, activeTrucks: 5, avgResponseTimeMin: 20 },
]

describe('CompanyPerformancePage — US-M04 company performance monitoring', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the companies table', async () => {
    vi.spyOn(companiesApi, 'getCompanyPerformance').mockResolvedValue(mockCompanies)
    render(<MemoryRouter><CompanyPerformancePage /></MemoryRouter>)
    expect(await screen.findByTestId('companies-table')).toBeInTheDocument()
  })

  it('fetches companies with the user cityId', async () => {
    vi.spyOn(companiesApi, 'getCompanyPerformance').mockResolvedValue(mockCompanies)
    render(<MemoryRouter><CompanyPerformancePage /></MemoryRouter>)
    await waitFor(() => {
      expect(companiesApi.getCompanyPerformance).toHaveBeenCalledWith(CITY_ID)
    })
  })

  it('displays all company rows', async () => {
    vi.spyOn(companiesApi, 'getCompanyPerformance').mockResolvedValue(mockCompanies)
    render(<MemoryRouter><CompanyPerformancePage /></MemoryRouter>)
    await screen.findByTestId('companies-table')
    expect(screen.getByTestId('company-row-c1')).toBeInTheDocument()
    expect(screen.getByTestId('company-row-c2')).toBeInTheDocument()
    expect(screen.getByTestId('company-row-c3')).toBeInTheDocument()
  })

  it('sorts by collectionRate descending by default', async () => {
    vi.spyOn(companiesApi, 'getCompanyPerformance').mockResolvedValue(mockCompanies)
    render(<MemoryRouter><CompanyPerformancePage /></MemoryRouter>)
    await screen.findByTestId('companies-table')
    const rows = screen.getAllByTestId(/^company-row-/)
    // GreenFleet (90%) should be first, then CleanCo (80%), then EcoWaste (50%)
    expect(rows[0]).toHaveAttribute('data-testid', 'company-row-c3')
    expect(rows[1]).toHaveAttribute('data-testid', 'company-row-c1')
    expect(rows[2]).toHaveAttribute('data-testid', 'company-row-c2')
  })

  it('toggles sort direction when clicking the same column', async () => {
    vi.spyOn(companiesApi, 'getCompanyPerformance').mockResolvedValue(mockCompanies)
    render(<MemoryRouter><CompanyPerformancePage /></MemoryRouter>)
    await screen.findByTestId('companies-table')

    // Click collectionRate again → should flip to ascending
    fireEvent.click(screen.getByTestId('sort-collectionRate'))
    const rows = screen.getAllByTestId(/^company-row-/)
    expect(rows[0]).toHaveAttribute('data-testid', 'company-row-c2') // EcoWaste 50% is lowest
  })

  it('shows company detail panel when a row is clicked', async () => {
    vi.spyOn(companiesApi, 'getCompanyPerformance').mockResolvedValue(mockCompanies)
    render(<MemoryRouter><CompanyPerformancePage /></MemoryRouter>)
    await screen.findByTestId('companies-table')

    fireEvent.click(screen.getByTestId('company-row-c1'))
    const detail = await screen.findByTestId('company-detail')
    expect(detail).toBeInTheDocument()
    expect(detail).toHaveTextContent('CleanCo')
  })

  it('shows error message when fetch fails', async () => {
    vi.spyOn(companiesApi, 'getCompanyPerformance').mockRejectedValue(new Error('Network error'))
    render(<MemoryRouter><CompanyPerformancePage /></MemoryRouter>)
    expect(await screen.findByText('Failed to load company performance data.')).toBeInTheDocument()
  })
})
