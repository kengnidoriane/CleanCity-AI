import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from '../pages/LoginPage'
import * as authApi from '../api/auth'
import * as authStore from '../store/authStore'

vi.mock('../api/auth')
vi.mock('../store/authStore')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

const mockSetAuth = vi.fn()
vi.spyOn(authStore, 'useAuthStore').mockImplementation((selector) =>
  selector({ setAuth: mockSetAuth } as unknown as Parameters<typeof selector>[0])
)

describe('LoginPage — US-M01 municipal login', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders email and password fields', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    expect(screen.getByPlaceholderText('municipal@city.gov')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Your password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows validation errors on empty submit', async () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText('Invalid email address')).toBeInTheDocument()
    expect(await screen.findByText('Password must be at least 6 characters')).toBeInTheDocument()
  })

  it('calls loginMunicipal and setAuth on valid credentials', async () => {
    const mockResponse = {
      token: 'jwt-token',
      user: { id: 'u1', name: 'City Admin', email: 'admin@city.gov', role: 'MUNICIPAL' as const, cityId: 'city-1' },
    }
    vi.spyOn(authApi, 'loginMunicipal').mockResolvedValue(mockResponse)

    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    fireEvent.change(screen.getByPlaceholderText('municipal@city.gov'), {
      target: { value: 'admin@city.gov' },
    })
    fireEvent.change(screen.getByPlaceholderText('Your password'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(authApi.loginMunicipal).toHaveBeenCalledWith('admin@city.gov', 'password123')
      expect(mockSetAuth).toHaveBeenCalledWith('jwt-token', mockResponse.user)
    })
  })

  it('shows error message on invalid credentials', async () => {
    vi.spyOn(authApi, 'loginMunicipal').mockRejectedValue({
      response: { data: { message: 'Invalid email or password' } },
    })

    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    fireEvent.change(screen.getByPlaceholderText('municipal@city.gov'), {
      target: { value: 'wrong@city.gov' },
    })
    fireEvent.change(screen.getByPlaceholderText('Your password'), {
      target: { value: 'wrongpass' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument()
  })

  it('rejects non-municipal accounts', async () => {
    vi.spyOn(authApi, 'loginMunicipal').mockResolvedValue({
      token: 'jwt',
      user: { id: 'u1', name: 'CleanCo', email: 'co@example.com', role: 'COMPANY' as any, cityId: 'city-1' },
    })

    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    fireEvent.change(screen.getByPlaceholderText('municipal@city.gov'), {
      target: { value: 'co@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Your password'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Access restricted to municipal accounts only.')).toBeInTheDocument()
  })
})
