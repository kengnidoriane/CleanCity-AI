import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import LoginScreen from '../screens/LoginScreen'
import * as authApi from '../api/auth'
import * as authStore from '../store/authStore'

jest.mock('../api/auth')
jest.mock('../store/authStore')

const mockSetAuth = jest.fn()
jest.spyOn(authStore, 'useAuthStore').mockImplementation((selector) =>
  selector({ setAuth: mockSetAuth } as unknown as Parameters<typeof selector>[0])
)

describe('LoginScreen — US-C02 citizen login', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders phone and password fields', () => {
    const { getByTestId } = render(<LoginScreen />)
    expect(getByTestId('input-phone')).toBeTruthy()
    expect(getByTestId('input-password')).toBeTruthy()
    expect(getByTestId('btn-login')).toBeTruthy()
  })

  it('shows validation errors when submitting empty form', async () => {
    const { getByTestId, findByText } = render(<LoginScreen />)
    fireEvent.press(getByTestId('btn-login'))
    expect(await findByText('Phone number is required')).toBeTruthy()
    expect(await findByText('Password must be at least 6 characters')).toBeTruthy()
  })

  it('calls loginCitizen and setAuth on valid credentials', async () => {
    const mockResponse = {
      token: 'jwt-token',
      user: { id: 'user-1', name: 'Alice', phone: '+221770000000', role: 'CITIZEN', cityId: 'city-1' },
    }
    jest.spyOn(authApi, 'loginCitizen').mockResolvedValue(mockResponse)

    const onSuccess = jest.fn()
    const { getByTestId } = render(<LoginScreen onSuccess={onSuccess} />)

    fireEvent.changeText(getByTestId('input-phone'), '+221770000000')
    fireEvent.changeText(getByTestId('input-password'), 'password123')
    fireEvent.press(getByTestId('btn-login'))

    await waitFor(() => {
      expect(authApi.loginCitizen).toHaveBeenCalledWith('+221770000000', 'password123')
      expect(mockSetAuth).toHaveBeenCalledWith('jwt-token', mockResponse.user)
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('shows error message on invalid credentials', async () => {
    jest.spyOn(authApi, 'loginCitizen').mockRejectedValue({
      response: { data: { message: 'Invalid phone or password' } },
    })

    const { getByTestId, findByText } = render(<LoginScreen />)
    fireEvent.changeText(getByTestId('input-phone'), '+221770000000')
    fireEvent.changeText(getByTestId('input-password'), 'wrongpass')
    fireEvent.press(getByTestId('btn-login'))

    expect(await findByText('Invalid phone or password')).toBeTruthy()
  })

  it('navigates to register when sign up link is pressed', () => {
    const onRegisterPress = jest.fn()
    const { getByTestId } = render(<LoginScreen onRegisterPress={onRegisterPress} />)
    fireEvent.press(getByTestId('btn-go-register'))
    expect(onRegisterPress).toHaveBeenCalled()
  })
})
