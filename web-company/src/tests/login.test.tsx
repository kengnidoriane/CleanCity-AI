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

describe('LoginPage — US-E01 company login', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders email and password fields', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    expect(screen.getByPlaceholderText('company@example.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Your password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows validation errors on empty submit', async () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText('Invalid email address')).toBeInTheDocument()
    expect(await screen.findByText('Password must be at least 6 characters')).toBeInTheDocument()
  })

  it('calls loginCompany and setAuth on valid credentials', async () => {
    const mockResponse = {
      token: 'jwt-token',
      user: { id: 'u1', name: 'CleanCo', email: 'co@example.com', role: 'COMPANY' as const, cityId: 'city-1' },
    }
    vi.spyOn(authApi, 'loginCompany').mockResolvedValue(mockResponse)

    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    fireEvent.change(screen.getByPlaceholderText('company@example.com'), {
      target: { value: 'co@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Your password'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(authApi.loginCompany).toHaveBeenCalledWith('co@example.com', 'password123')
      expect(mockSetAuth).toHaveBeenCalledWith('jwt-token', mockResponse.user)
    })
  })

  it('shows error message on invalid credentials', async () => {
    vi.spyOn(authApi, 'loginCompany').mockRejectedValue({
      response: { data: { message: 'Invalid email or password' } },
    })

    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    fireEvent.change(screen.getByPlaceholderText('company@example.com'), {
      target: { value: 'wrong@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Your password'), {
      target: { value: 'wrongpass' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument()
  })

  it('rejects non-company accounts', async () => {
    vi.spyOn(authApi, 'loginCompany').mockResolvedValue({
      token: 'jwt',
      user: { id: 'u1', name: 'Alice', email: 'citizen@example.com', role: 'CITIZEN' as any, cityId: 'city-1' },
    })

    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    fireEvent.change(screen.getByPlaceholderText('company@example.com'), {
      target: { value: 'citizen@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Your password'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Access restricted to company accounts only.')).toBeInTheDocument()
  })
})
