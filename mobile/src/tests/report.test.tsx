import React from 'react'
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import ReportScreen from '../screens/ReportScreen'
import * as reportsApi from '../api/reports'
import * as authStore from '../store/authStore'
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'

jest.mock('../api/reports')
jest.mock('../store/authStore')
jest.mock('expo-image-picker')
jest.mock('expo-location')

const CITY_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'

jest.spyOn(authStore, 'useAuthStore').mockImplementation((selector) =>
  selector({
    user: { id: 'user-1', name: 'Alice', phone: '+221770000000', role: 'CITIZEN', cityId: CITY_ID },
  } as unknown as Parameters<typeof selector>[0])
)

describe('ReportScreen — US-C03 to C06 waste report submission', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Default: GPS available
    jest.spyOn(Location, 'requestForegroundPermissionsAsync').mockResolvedValue(
      { status: 'granted', granted: true, canAskAgain: true, expires: 'never' } as any
    )
    jest.spyOn(Location, 'getCurrentPositionAsync').mockResolvedValue(
      { coords: { latitude: 14.6928, longitude: -17.4467, altitude: null, accuracy: 5, altitudeAccuracy: null, heading: null, speed: null }, timestamp: Date.now() } as any
    )

    // Default: camera available
    jest.spyOn(ImagePicker, 'requestCameraPermissionsAsync').mockResolvedValue(
      { status: 'granted', granted: true, canAskAgain: true, expires: 'never' } as any
    )
    jest.spyOn(ImagePicker, 'launchCameraAsync').mockResolvedValue(
      { canceled: false, assets: [{ uri: 'file://photo.jpg', width: 800, height: 600, type: 'image', fileName: 'photo.jpg', mimeType: 'image/jpeg', fileSize: 50000, base64: null, duration: null, exif: null }] } as any
    )
  })

  it('renders category and severity selectors', () => {
    const { getByTestId } = render(<ReportScreen />)
    expect(getByTestId('btn-take-photo')).toBeTruthy()
    expect(getByTestId('btn-submit')).toBeTruthy()
  })

  it('captures photo when camera button is pressed', async () => {
    const { getByTestId, findByTestId } = render(<ReportScreen />)
    fireEvent.press(getByTestId('btn-take-photo'))
    await findByTestId('photo-preview')
    expect(ImagePicker.launchCameraAsync).toHaveBeenCalled()
  })

  it('submits report with photo, GPS, category and severity', async () => {
    jest.spyOn(reportsApi, 'submitReport').mockResolvedValue({
      id: 'report-1',
      status: 'PENDING',
      wasteType: 'PLASTIC',
      severity: 'MEDIUM',
      latitude: 14.6928,
      longitude: -17.4467,
      photoUrl: 'https://storage.example.com/photo.jpg',
      createdAt: new Date().toISOString(),
    })

    const onSuccess = jest.fn()
    const { getByTestId } = render(<ReportScreen onSuccess={onSuccess} />)

    // Take photo
    fireEvent.press(getByTestId('btn-take-photo'))
    await waitFor(() => expect(ImagePicker.launchCameraAsync).toHaveBeenCalled())

    // Select waste type
    fireEvent.press(getByTestId('category-PLASTIC'))

    // Select severity
    fireEvent.press(getByTestId('severity-MEDIUM'))

    // Submit
    fireEvent.press(getByTestId('btn-submit'))

    await waitFor(() => {
      expect(reportsApi.submitReport).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: 14.6928,
          longitude: -17.4467,
          wasteType: 'PLASTIC',
          severity: 'MEDIUM',
          cityId: CITY_ID,
        })
      )
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('shows error if photo is missing on submit', async () => {
    // Override camera to return canceled
    jest.spyOn(ImagePicker, 'launchCameraAsync').mockResolvedValue({ canceled: true, assets: [] } as any)

    const { getByTestId, findByText } = render(<ReportScreen />)
    fireEvent.press(getByTestId('btn-submit'))
    expect(await findByText('Please take a photo first')).toBeTruthy()
  })

  it('shows error if category is not selected on submit', async () => {
    const { getByTestId, findByText } = render(<ReportScreen />)

    // Take photo first
    fireEvent.press(getByTestId('btn-take-photo'))
    await waitFor(() => expect(ImagePicker.launchCameraAsync).toHaveBeenCalled())

    // Submit without selecting category
    fireEvent.press(getByTestId('btn-submit'))
    expect(await findByText('Please select a waste category')).toBeTruthy()
  })
})
