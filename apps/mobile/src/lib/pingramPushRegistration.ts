import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { getPingramApiBaseUrl, getPingramClientId } from '@/lib/pingram';

function encodeBasicAuthToken(clientId: string, userId: string): string {
  const value = `${clientId}:${userId}`;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let index = 0;

  while (index < value.length) {
    const byte1 = value.charCodeAt(index++);
    const byte2 = index < value.length ? value.charCodeAt(index++) : undefined;
    const byte3 = index < value.length ? value.charCodeAt(index++) : undefined;
    const bitmap = (byte1 << 16) | ((byte2 ?? 0) << 8) | (byte3 ?? 0);

    result += chars.charAt((bitmap >> 18) & 63);
    result += chars.charAt((bitmap >> 12) & 63);
    result += byte2 !== undefined ? chars.charAt((bitmap >> 6) & 63) : '=';
    result += byte3 !== undefined ? chars.charAt(bitmap & 63) : '=';
  }

  return result;
}

function getApnsEnvironment(): 'sandbox' | 'production' {
  const entitlements = Constants.expoConfig?.ios?.entitlements;
  const apsEnvironment =
    entitlements && typeof entitlements === 'object'
      ? entitlements['aps-environment']
      : undefined;

  return apsEnvironment === 'development' ? 'sandbox' : 'production';
}

async function getDeviceRegistrationInfo() {
  const iosVendorId =
    Platform.OS === 'ios' ? await Application.getIosIdForVendorAsync() : null;

  return {
    device_id: iosVendorId ?? Application.applicationId ?? 'unknown_device',
    platform: Platform.OS,
    manufacturer: Device.manufacturer ?? undefined,
    model: Device.modelName ?? undefined,
    app_id: Application.applicationId ?? undefined,
  };
}

async function syncPushTokenWithPingram(userId: string, token: string): Promise<void> {
  const clientId = getPingramClientId();
  if (!clientId) {
    throw new Error('Pingram client ID is not configured');
  }

  const device = await getDeviceRegistrationInfo();
  const pushToken = {
    type: Platform.OS === 'ios' ? ('APN' as const) : ('FCM' as const),
    token,
    device,
    ...(Platform.OS === 'ios' ? { environment: getApnsEnvironment() } : {}),
  };

  const response = await fetch(
    `${getPingramApiBaseUrl()}/${clientId}/users/${encodeURIComponent(userId)}/`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${encodeBasicAuthToken(clientId, userId)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: userId,
        pushTokens: [pushToken],
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Pingram push registration failed (${response.status})`);
  }
}

export async function registerPingramPushNotifications(userId: string): Promise<boolean> {
  if (!Device.isDevice) {
    return false;
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

  const pushToken = await Notifications.getDevicePushTokenAsync();
  if (!pushToken.data) {
    throw new Error('Device push token is unavailable');
  }

  await syncPushTokenWithPingram(userId, pushToken.data);
  return true;
}
