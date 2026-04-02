import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import ScheduleScreen from '../screens/ScheduleScreen'
import * as schedulesApi from '../api/schedules'
import * as authStore from '../store/authStore'

jest.mock('../api/schedules')
jest.mock('../store/authStore')

const CITY_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'

jest.spyOn(authStore, 'useAuthStore').mockImplementation((selector) =>
  selector({
    user: { id: 'user-1', name: 'Alice', phone: '+221770000000', role: 'CITIZEN', cityId: CITY_ID },
  } as unknown as Parameters<typeof selector>[0])
)

const mockSchedules = [
  { id: 's1', zone: 'Plateau', dayOfWeek: 1, timeWindowStart: '08:00', timeWindowEnd: '12:00', companyId: 'c1', cityId: CITY_ID },
  { id: 's2', zone: 'Plateau', dayOfWeek: 4, timeWindowStart: '14:00', timeWindowEnd: '18:00', companyId: 'c1', cityId: CITY_ID },
  { id: 's3', zone: 'Médina',  dayOfWeek: 2, timeWindowStart: '07:00', timeWindowEnd: '11:00', companyId: 'c1', cityId: CITY_ID },
]

describe('ScheduleScreen — US-C10 collection schedule', () => {
  beforeEach(() => jest.clearAllMocks())

  it('shows loading state initially', () => {
    jest.spyOn(schedulesApi, 'getSchedules').mockReturnValue(new Promise(() => {}))
    const { getByTestId } = render(<ScheduleScreen />)
    expect(getByTestId('loading-indicator')).toBeTruthy()
  })

  it('renders schedules grouped by zone', async () => {
    jest.spyOn(schedulesApi, 'getSchedules').mockResolvedValue(mockSchedules)
    const { findByTestId } = render(<ScheduleScreen />)
    expect(await findByTestId('zone-Plateau')).toBeTruthy()
    expect(await findByTestId('zone-Médina')).toBeTruthy()
  })

  it('renders schedule items with day and time window', async () => {
    jest.spyOn(schedulesApi, 'getSchedules').mockResolvedValue(mockSchedules)
    const { findByTestId } = render(<ScheduleScreen />)
    expect(await findByTestId('schedule-item-s1')).toBeTruthy()
    expect(await findByTestId('schedule-item-s2')).toBeTruthy()
    expect(await findByTestId('schedule-item-s3')).toBeTruthy()
  })

  it('shows empty state when no schedules', async () => {
    jest.spyOn(schedulesApi, 'getSchedules').mockResolvedValue([])
    const { findByTestId } = render(<ScheduleScreen />)
    expect(await findByTestId('empty-state')).toBeTruthy()
  })

  it('shows error state when fetch fails', async () => {
    jest.spyOn(schedulesApi, 'getSchedules').mockRejectedValue(new Error('Network error'))
    const { findByTestId } = render(<ScheduleScreen />)
    expect(await findByTestId('error-state')).toBeTruthy()
  })

  it('fetches schedules using the user cityId', async () => {
    jest.spyOn(schedulesApi, 'getSchedules').mockResolvedValue(mockSchedules)
    render(<ScheduleScreen />)
    await waitFor(() => {
      expect(schedulesApi.getSchedules).toHaveBeenCalledWith(CITY_ID)
    })
  })
})
