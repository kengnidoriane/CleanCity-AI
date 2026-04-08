import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AuditTrailPage from '../pages/AuditTrailPage'
import * as auditApi from '../api/audit'
import * as authStore from '../store/authStore'

vi.mock('../api/audit', async () => {
  const actual = await vi.importActual('../api/audit')
  return { ...actual, getAuditTrail: vi.fn(), downloadAuditCsv: vi.fn() }
})
vi.mock('../store/authStore')

const CITY_ID = 'city-abc-123'

vi.spyOn(authStore, 'useAuthStore').mockImplementation((selector) =>
  selector({
    user: { id: 'u1', name: 'City Admin', email: 'admin@city.gov', role: 'MUNICIPAL', cityId: CITY_ID },
  } as unknown as Parameters<typeof selector>[0])
)

const mockPage = {
  data: [
    {
      id: 'r1', latitude: 14.69, longitude: -17.44,
      wasteType: 'PLASTIC' as const, severity: 'HIGH' as const,
      status: 'COLLECTED' as const, photoUrl: '', companyId: 'c1',
      collectedAt: '2026-03-20T10:00:00Z', createdAt: '2026-03-19T08:00:00Z', cityId: CITY_ID,
    },
    {
      id: 'r2', latitude: 14.71, longitude: -17.46,
      wasteType: 'ORGANIC' as const, severity: 'LOW' as const,
      status: 'PENDING' as const, photoUrl: '', companyId: null,
      collectedAt: null, createdAt: '2026-03-18T09:00:00Z', cityId: CITY_ID,
    },
  ],
  total: 2,
  page: 1,
  limit: 50,
}

describe('AuditTrailPage — US-M06 audit trail', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the audit table', async () => {
    vi.spyOn(auditApi, 'getAuditTrail').mockResolvedValue(mockPage)
    render(<MemoryRouter><AuditTrailPage /></MemoryRouter>)
    expect(await screen.findByTestId('audit-table')).toBeInTheDocument()
  })

  it('fetches audit trail with cityId on mount', async () => {
    vi.spyOn(auditApi, 'getAuditTrail').mockResolvedValue(mockPage)
    render(<MemoryRouter><AuditTrailPage /></MemoryRouter>)
    await waitFor(() => {
      expect(auditApi.getAuditTrail).toHaveBeenCalledWith(CITY_ID, expect.objectContaining({ page: 1 }))
    })
  })

  it('renders a row for each report', async () => {
    vi.spyOn(auditApi, 'getAuditTrail').mockResolvedValue(mockPage)
    render(<MemoryRouter><AuditTrailPage /></MemoryRouter>)
    expect(await screen.findByTestId('audit-row-r1')).toBeInTheDocument()
    expect(screen.getByTestId('audit-row-r2')).toBeInTheDocument()
  })

  it('displays correct status badges', async () => {
    vi.spyOn(auditApi, 'getAuditTrail').mockResolvedValue(mockPage)
    render(<MemoryRouter><AuditTrailPage /></MemoryRouter>)
    await screen.findByTestId('audit-table')
    const row1 = screen.getByTestId('audit-row-r1')
    const row2 = screen.getByTestId('audit-row-r2')
    expect(row1).toHaveTextContent('Collected')
    expect(row2).toHaveTextContent('Pending')
  })

  it('refetches when status filter changes', async () => {
    vi.spyOn(auditApi, 'getAuditTrail').mockResolvedValue(mockPage)
    render(<MemoryRouter><AuditTrailPage /></MemoryRouter>)
    await screen.findByTestId('audit-table')

    fireEvent.change(screen.getByTestId('filter-status'), { target: { value: 'COLLECTED' } })

    await waitFor(() => {
      expect(auditApi.getAuditTrail).toHaveBeenCalledWith(
        CITY_ID,
        expect.objectContaining({ status: 'COLLECTED', page: 1 })
      )
    })
  })

  it('calls downloadAuditCsv when export button is clicked', async () => {
    vi.spyOn(auditApi, 'getAuditTrail').mockResolvedValue(mockPage)
    const exportSpy = vi.spyOn(auditApi, 'downloadAuditCsv').mockImplementation(() => {})
    render(<MemoryRouter><AuditTrailPage /></MemoryRouter>)
    await screen.findByTestId('audit-table')

    fireEvent.click(screen.getByTestId('btn-export-csv'))
    expect(exportSpy).toHaveBeenCalledWith(CITY_ID, expect.any(Object))
  })

  it('shows error message when fetch fails', async () => {
    vi.spyOn(auditApi, 'getAuditTrail').mockRejectedValue(new Error('Network error'))
    render(<MemoryRouter><AuditTrailPage /></MemoryRouter>)
    expect(await screen.findByText('Failed to load audit trail.')).toBeInTheDocument()
  })

  it('shows pagination when total exceeds page size', async () => {
    vi.spyOn(auditApi, 'getAuditTrail').mockResolvedValue({ ...mockPage, total: 120 })
    render(<MemoryRouter><AuditTrailPage /></MemoryRouter>)
    expect(await screen.findByTestId('pagination')).toBeInTheDocument()
    expect(screen.getByTestId('btn-next-page')).toBeInTheDocument()
  })
})
