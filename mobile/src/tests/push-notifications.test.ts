import { registerPushToken } from '../services/notifications'
import * as apiUsers from '../api/users'
import * as Notifications from 'expo-notifications'

jest.mock('../api/users')
jest.mock('expo-notifications')

describe('Push notification service — US-C09', () => {
  beforeEach(() => jest.clearAllMocks())

  it('requests permission, gets token and registers it with the backend', async () => {
    jest.spyOn(Notifications, 'requestPermissionsAsync').mockResolvedValue(
      { status: 'granted', granted: true, canAskAgain: true, expires: 'never', ios: undefined } as any
    )
    jest.spyOn(Notifications, 'getExpoPushTokenAsync').mockResolvedValue(
      { data: 'ExponentPushToken[test-token-123]', type: 'expo' } as any
    )
    jest.spyOn(apiUsers, 'savePushToken').mockResolvedValue()

    const token = await registerPushToken()

    expect(Notifications.requestPermissionsAsync).toHaveBeenCalled()
    expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalled()
    expect(apiUsers.savePushToken).toHaveBeenCalledWith('ExponentPushToken[test-token-123]')
    expect(token).toBe('ExponentPushToken[test-token-123]')
  })

  it('returns null if permission is denied', async () => {
    jest.spyOn(Notifications, 'requestPermissionsAsync').mockResolvedValue(
      { status: 'denied', granted: false, canAskAgain: false, expires: 'never', ios: undefined } as any
    )

    const token = await registerPushToken()

    expect(token).toBeNull()
    expect(apiUsers.savePushToken).not.toHaveBeenCalled()
  })

  it('returns null and does not throw if backend call fails', async () => {
    jest.spyOn(Notifications, 'requestPermissionsAsync').mockResolvedValue(
      { status: 'granted', granted: true, canAskAgain: true, expires: 'never', ios: undefined } as any
    )
    jest.spyOn(Notifications, 'getExpoPushTokenAsync').mockResolvedValue(
      { data: 'ExponentPushToken[test-token-123]', type: 'expo' } as any
    )
    jest.spyOn(apiUsers, 'savePushToken').mockRejectedValue(new Error('Network error'))

    // Should not throw — push token registration is non-blocking
    const token = await registerPushToken()
    expect(token).toBeNull()
  })
})
