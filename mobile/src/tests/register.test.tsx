import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import RegisterScreen from '../screens/RegisterScreen'
import * as authApi from '../api/auth'
import * as authStore from '../store/authStore'

jest.mock('../api/auth')
jest.mock('../store/authStore')

const mockSetAuth = jest.fn()
jest.spyOn(authStore, 'useAuthStore').mockImplementation((selector) =>
  selector({ setAuth: mockSetAuth } as unknown as Parameters<typeof selector>[0])
)

const VALID_CITY_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'

describe('RegisterScreen — US-C01 citizen registration', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders all required fields', () => {
    const { getByTestId } = render(<RegisterScreen defaultCityId={VALID_CITY_ID} />)
    expect(getByTestId('input-name')).toBeTruthy()
    expect(getByTestId('input-phone')).toBeTruthy()
    expect(getByTestId('input-password')).toBeTruthy()
    expect(getByTestId('btn-register')).toBeTruthy()
  })

  it('shows validation errors when submitting empty form', async () => {
    const { getByTestId, findByText } = render(<RegisterScreen defaultCityId={VALID_CITY_ID} />)
    fireEvent.press(getByTestId('btn-register'))
    expect(await findByText('Name must be at least 2 characters')).toBeTruthy()
    expect(await findByText('Phone number is required')).toBeTruthy()
    expect(await findByText('Password must be at least 6 characters')).toBeTruthy()
  })

  it('calls registerCitizen and setAuth on valid submission', async () => {
    const mockResponse = {
      token: 'jwt-token',
      user: { id: 'user-1', name: 'Alice', phone: '+221770000000', role: 'CITIZEN', cityId: VALID_CITY_ID },
    }
    jest.spyOn(authApi, 'registerCitizen').mockResolvedValue(mockResponse)

    const onSuccess = jest.fn()
    const { getByTestId } = render(
      <RegisterScreen defaultCityId={VALID_CITY_ID} onSuccess={onSuccess} />
    )

    fireEvent.changeText(getByTestId('input-name'), 'Alice')
    fireEvent.changeText(getByTestId('input-phone'), '+221770000000')
    fireEvent.changeText(getByTestId('input-password'), 'password123')
    fireEvent.press(getByTestId('btn-register'))

    await waitFor(() => {
      expect(authApi.registerCitizen).toHaveBeenCalledWith({
        name: 'Alice',
        phone: '+221770000000',
        password: 'password123',
        cityId: VALID_CITY_ID,
      })
      expect(mockSetAuth).toHaveBeenCalledWith('jwt-token', mockResponse.user)
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('shows error alert when registration fails', async () => {
    jest.spyOn(authApi, 'registerCitizen').mockRejectedValue({
      response: { data: { message: 'Phone number already exists' } },
    })

    const { getByTestId } = render(<RegisterScreen defaultCityId={VALID_CITY_ID} />)
    fireEvent.changeText(getByTestId('input-name'), 'Alice')
    fireEvent.changeText(getByTestId('input-phone'), '+221770000000')
    fireEvent.changeText(getByTestId('input-password'), 'password123')
    fireEvent.press(getByTestId('btn-register'))

    await waitFor(() => {
      expect(authApi.registerCitizen).toHaveBeenCalled()
    })
  })

  it('navigates to login when sign in link is pressed', () => {
    const onLoginPress = jest.fn()
    const { getByTestId } = render(
      <RegisterScreen defaultCityId={VALID_CITY_ID} onLoginPress={onLoginPress} />
    )
    fireEvent.press(getByTestId('btn-go-login'))
    expect(onLoginPress).toHaveBeenCalled()
  })
})
