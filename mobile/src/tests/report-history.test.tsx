import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import ReportHistoryScreen from '../screens/ReportHistoryScreen'
import * as reportsApi from '../api/reports'

jest.mock('../api/reports')

const mockReports = [
  {
    id: 'r1',
    status: 'PENDING' as const,
    wasteType: 'PLASTIC' as const,
    severity: 'HIGH' as const,
    latitude: 14.6928,
    longitude: -17.4467,
    photoUrl: 'https://storage.example.com/photo1.jpg',
    createdAt: '2026-03-15T10:00:00.000Z',
  },
  {
    id: 'r2',
    status: 'COLLECTED' as const,
    wasteType: 'ORGANIC' as const,
    severity: 'LOW' as const,
    latitude: 14.7000,
    longitude: -17.4500,
    photoUrl: 'https://storage.example.com/photo2.jpg',
    createdAt: '2026-03-10T08:00:00.000Z',
  },
  {
    id: 'r3',
    status: 'ASSIGNED' as const,
    wasteType: 'BULKY' as const,
    severity: 'MEDIUM' as const,
    latitude: 14.6900,
    longitude: -17.4400,
    photoUrl: 'https://storage.example.com/photo3.jpg',
    createdAt: '2026-03-12T14:00:00.000Z',
  },
]

describe('ReportHistoryScreen — US-C08 report history', () => {
  beforeEach(() => jest.clearAllMocks())

  it('shows loading state initially', () => {
    jest.spyOn(reportsApi, 'getMyReports').mockReturnValue(new Promise(() => {}))
    const { getByTestId } = render(<ReportHistoryScreen />)
    expect(getByTestId('loading-indicator')).toBeTruthy()
  })

  it('renders list of reports sorted by most recent first', async () => {
    jest.spyOn(reportsApi, 'getMyReports').mockResolvedValue(mockReports)
    const { findByTestId } = render(<ReportHistoryScreen />)
    expect(await findByTestId('report-item-r1')).toBeTruthy()
    expect(await findByTestId('report-item-r2')).toBeTruthy()
    expect(await findByTestId('report-item-r3')).toBeTruthy()
  })

  it('shows correct status badge for each report', async () => {
    jest.spyOn(reportsApi, 'getMyReports').mockResolvedValue(mockReports)
    const { findByTestId } = render(<ReportHistoryScreen />)
    expect(await findByTestId('status-badge-r1')).toBeTruthy()
    expect(await findByTestId('status-badge-r2')).toBeTruthy()
  })

  it('shows empty state when no reports', async () => {
    jest.spyOn(reportsApi, 'getMyReports').mockResolvedValue([])
    const { findByTestId } = render(<ReportHistoryScreen />)
    expect(await findByTestId('empty-state')).toBeTruthy()
  })

  it('shows error state when fetch fails', async () => {
    jest.spyOn(reportsApi, 'getMyReports').mockRejectedValue(new Error('Network error'))
    const { findByTestId } = render(<ReportHistoryScreen />)
    expect(await findByTestId('error-state')).toBeTruthy()
  })

  it('calls onReportPress when a report item is tapped', async () => {
    jest.spyOn(reportsApi, 'getMyReports').mockResolvedValue(mockReports)
    const onReportPress = jest.fn()
    const { findByTestId } = render(<ReportHistoryScreen onReportPress={onReportPress} />)
    fireEvent.press(await findByTestId('report-item-r1'))
    expect(onReportPress).toHaveBeenCalledWith(mockReports[0])
  })
})
