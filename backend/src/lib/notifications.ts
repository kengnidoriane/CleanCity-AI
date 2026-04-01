import Expo from 'expo-server-sdk'

const expo = new Expo()

export async function sendPushNotification(pushToken: string, message: string) {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.warn(`Invalid Expo push token: ${pushToken}`)
    return
  }

  const messages = [{
    to: pushToken,
    sound: 'default' as const,
    body: message,
    data: {},
  }]

  const chunks = expo.chunkPushNotifications(messages)
  for (const chunk of chunks) {
    await expo.sendPushNotificationsAsync(chunk)
  }
}
