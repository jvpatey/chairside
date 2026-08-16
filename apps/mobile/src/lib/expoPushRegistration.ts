import { deleteUserPushTokens, upsertUserPushToken } from '@chairside/api';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { getExpoProjectId, isNativePushAvailable } from '@/lib/expoPush';

export async function unregisterExpoPushNotifications(userId: string): Promise<void> {
  if (!Device.isDevice) return;

  try {
    await deleteUserPushTokens(userId);
  } catch (error) {
    console.warn('Expo push deregistration failed', error);
  }
}

export async function registerExpoPushNotifications(userId: string): Promise<boolean> {
  if (!Device.isDevice || !isNativePushAvailable()) {
    return false;
  }

  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return false;
  }

  const projectId = getExpoProjectId();
  if (!projectId) {
    throw new Error('EAS projectId is missing; cannot register Expo push token');
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  const pushToken = await Notifications.getExpoPushTokenAsync({ projectId });
  if (!pushToken.data) {
    throw new Error('Expo push token is unavailable');
  }

  await upsertUserPushToken(userId, pushToken.data, Platform.OS);
  return true;
}
