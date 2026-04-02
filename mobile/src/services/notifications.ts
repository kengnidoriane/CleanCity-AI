import * as Notifications from 'expo-notifications'
import { savePushToken } from '../api/users'

/**
 * Request notification permission, get the Expo push token,
 * and register it with the backend.
 *
 * Design principles:
 * - Non-blocking: never throws, returns null on any failure
 * - Idempotent: safe to call multiple times (backend upserts the token)
 * - Separated from auth flow: called after login, not during
 *
 * @returns The Expo push token string, or null if unavailable
 */
export async function registerPushToken(): Promise<string | null> {
  try {
    const { status } = await Notifications.requestPermissionsAsync()
    if (status !== 'granted') return null

    const { data: token } = await Notifications.getExpoPushTokenAsync()
    await savePushToken(token)
    return token
  } catch {
    // Non-blocking — push token failure must never break the app flow
    return null
  }
}
