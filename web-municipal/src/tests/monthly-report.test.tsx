import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MonthlyReportPage from '../pages/MonthlyReportPage'
import * as reportsApi from '../api/reports'
import * as authStore from '../store/authStore'

vi.mock('../api/reports', async () => {
  const actual = await vi.importActual('../api/reports')
  return { ...actual, downloadMonthlyReport: vi.fn() }
})
vi.mock('../store/authStore')

const CITY_ID = 'city-abc-123'

vi.spyOn(authStore, 'useAuthStore').mockImplementation((selector) =>
  selector({
    user: { id: 'u1', name: 'City Admin', email: 'admin@city.gov', role: 'MUNICIPAL', cityId: CITY_ID },
  } as unknown as Parameters<typeof selector>[0])
)

describe('MonthlyReportPage — US-M07 monthly report', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the page with year and month selectors', () => {
    render(<MemoryRouter><MonthlyReportPage /></MemoryRouter>)
    expect(screen.getByTestId('monthly-report-page')).toBeInTheDocument()
    expect(screen.getByTestId('select-year')).toBeInTheDocument()
    expect(screen.getByTestId('select-month')).toBeInTheDocument()
    expect(screen.getByTestId('btn-generate-report')).toBeInTheDocument()
  })

  it('calls downloadMonthlyReport with correct params on button click', async () => {
    vi.spyOn(reportsApi, 'downloadMonthlyReport').mockResolvedValue(undefined)
    render(<MemoryRouter><MonthlyReportPage /></MemoryRouter>)

    fireEvent.change(screen.getByTestId('select-year'), { target: { value: '2026' } })
    fireEvent.change(screen.getByTestId('select-month'), { target: { value: '3' } })
    fireEvent.click(screen.getByTestId('btn-generate-report'))

    await waitFor(() => {
      expect(reportsApi.downloadMonthlyReport).toHaveBeenCalledWith(CITY_ID, 2026, 3)
    })
  })

  it('shows success feedback after successful download', async () => {
    vi.spyOn(reportsApi, 'downloadMonthlyReport').mockResolvedValue(undefined)
    render(<MemoryRouter><MonthlyReportPage /></MemoryRouter>)

    fireEvent.change(screen.getByTestId('select-month'), { target: { value: '3' } })
    fireEvent.click(screen.getByTestId('btn-generate-report'))

    expect(await screen.findByText(/downloaded successfully/i)).toBeInTheDocument()
  })

  it('shows error message when download fails', async () => {
    vi.spyOn(reportsApi, 'downloadMonthlyReport').mockRejectedValue(new Error('Network error'))
    render(<MemoryRouter><MonthlyReportPage /></MemoryRouter>)

    fireEvent.click(screen.getByTestId('btn-generate-report'))

    expect(await screen.findByText('Failed to generate the report. Please try again.')).toBeInTheDocument()
  })

  it('disables the button while generating', async () => {
    // Never resolves — simulates a pending request
    vi.spyOn(reportsApi, 'downloadMonthlyReport').mockReturnValue(new Promise(() => {}))
    render(<MemoryRouter><MonthlyReportPage /></MemoryRouter>)

    fireEvent.click(screen.getByTestId('btn-generate-report'))

    await waitFor(() => {
      expect(screen.getByTestId('btn-generate-report')).toBeDisabled()
    })
  })
})
