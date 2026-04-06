import { apiClient } from './client'

/**
 * Register the Expo push token with the backend.
 * Called once after login/app start when permission is granted.
 */
export async function savePushToken(pushToken: string): Promise<void> {
  await apiClient.post('/api/users/push-token', { pushToken })
}
