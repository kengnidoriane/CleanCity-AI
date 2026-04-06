import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CompanyRegistrationPage from '../pages/CompanyRegistrationPage'
import * as companiesRegisterApi from '../api/companies-register'
import * as authStore from '../store/authStore'

vi.mock('../api/companies-register', async () => {
  const actual = await vi.importActual('../api/companies-register')
  return { ...actual, registerCompany: vi.fn() }
})
vi.mock('../store/authStore')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

const CITY_ID = 'city-abc-123'

vi.spyOn(authStore, 'useAuthStore').mockImplementation((selector) =>
  selector({
    user: { id: 'u1', name: 'City Admin', email: 'admin@city.gov', role: 'MUNICIPAL', cityId: CITY_ID },
  } as unknown as Parameters<typeof selector>[0])
)

const mockCompany = {
  id: 'c1', name: 'CleanCo Dakar',
  email: 'contact@cleanco.sn', phone: '+221700000000',
  cityId: CITY_ID, createdAt: '2026-04-06T00:00:00Z',
}

describe('CompanyRegistrationPage — US-M08 company registration', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the registration form', () => {
    render(<MemoryRouter><CompanyRegistrationPage /></MemoryRouter>)
    expect(screen.getByTestId('registration-form')).toBeInTheDocument()
    expect(screen.getByTestId('input-name')).toBeInTheDocument()
    expect(screen.getByTestId('input-email')).toBeInTheDocument()
    expect(screen.getByTestId('input-phone')).toBeInTheDocument()
    expect(screen.getByTestId('btn-submit')).toBeInTheDocument()
  })

  it('shows validation errors on empty submit', async () => {
    render(<MemoryRouter><CompanyRegistrationPage /></MemoryRouter>)
    fireEvent.click(screen.getByTestId('btn-submit'))
    expect(await screen.findByText('Company name must be at least 2 characters')).toBeInTheDocument()
    expect(await screen.findByText('Invalid email address')).toBeInTheDocument()
  })

  it('calls registerCompany with correct data on valid submit', async () => {
    vi.spyOn(companiesRegisterApi, 'registerCompany').mockResolvedValue({
      company: mockCompany,
      message: 'Company registered and credentials sent to email',
    })

    render(<MemoryRouter><CompanyRegistrationPage /></MemoryRouter>)
    fireEvent.change(screen.getByTestId('input-name'), { target: { value: 'CleanCo Dakar' } })
    fireEvent.change(screen.getByTestId('input-email'), { target: { value: 'contact@cleanco.sn' } })
    fireEvent.change(screen.getByTestId('input-phone'), { target: { value: '+221700000000' } })
    fireEvent.click(screen.getByTestId('btn-submit'))

    await waitFor(() => {
      expect(companiesRegisterApi.registerCompany).toHaveBeenCalledWith({
        name: 'CleanCo Dakar',
        email: 'contact@cleanco.sn',
        phone: '+221700000000',
        cityId: CITY_ID,
      })
    })
  })

  it('shows success panel with company details after registration', async () => {
    vi.spyOn(companiesRegisterApi, 'registerCompany').mockResolvedValue({
      company: mockCompany,
      message: 'Company registered and credentials sent to email',
    })

    render(<MemoryRouter><CompanyRegistrationPage /></MemoryRouter>)
    fireEvent.change(screen.getByTestId('input-name'), { target: { value: 'CleanCo Dakar' } })
    fireEvent.change(screen.getByTestId('input-email'), { target: { value: 'contact@cleanco.sn' } })
    fireEvent.click(screen.getByTestId('btn-submit'))

    const panel = await screen.findByTestId('success-panel')
    expect(panel).toBeInTheDocument()
    expect(panel).toHaveTextContent('CleanCo Dakar')
    expect(panel).toHaveTextContent('contact@cleanco.sn')
  })

  it('shows error message on 409 conflict', async () => {
    vi.spyOn(companiesRegisterApi, 'registerCompany').mockRejectedValue({
      response: { data: { message: 'Email already in use' } },
    })

    render(<MemoryRouter><CompanyRegistrationPage /></MemoryRouter>)
    fireEvent.change(screen.getByTestId('input-name'), { target: { value: 'CleanCo' } })
    fireEvent.change(screen.getByTestId('input-email'), { target: { value: 'existing@co.sn' } })
    fireEvent.click(screen.getByTestId('btn-submit'))

    expect(await screen.findByText('Email already in use')).toBeInTheDocument()
  })

  it('resets form and shows it again when "Register another" is clicked', async () => {
    vi.spyOn(companiesRegisterApi, 'registerCompany').mockResolvedValue({
      company: mockCompany,
      message: 'Company registered and credentials sent to email',
    })

    render(<MemoryRouter><CompanyRegistrationPage /></MemoryRouter>)
    fireEvent.change(screen.getByTestId('input-name'), { target: { value: 'CleanCo Dakar' } })
    fireEvent.change(screen.getByTestId('input-email'), { target: { value: 'contact@cleanco.sn' } })
    fireEvent.click(screen.getByTestId('btn-submit'))

    await screen.findByTestId('success-panel')
    fireEvent.click(screen.getByTestId('btn-register-another'))

    expect(screen.getByTestId('registration-form')).toBeInTheDocument()
  })
})
