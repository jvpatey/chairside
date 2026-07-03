import Constants from 'expo-constants';
import { Platform } from 'react-native';

export function getRevenueCatIosApiKey(): string | undefined {
  const fromEnv = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim();
  if (fromEnv) return fromEnv;

  const extra = Constants.expoConfig?.extra as { revenueCatIosApiKey?: string } | undefined;
  return extra?.revenueCatIosApiKey?.trim() || undefined;
}

export function isRevenueCatSupportedPlatform(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

/** RevenueCat needs a dev build or TestFlight/App Store — not Expo Go. */
function isRevenueCatRuntimeAvailable(): boolean {
  if (Constants.executionEnvironment === 'storeClient') return false;
  if (Constants.appOwnership === 'expo') return false;
  return true;
}

export function isRevenueCatConfigured(): boolean {
  if (!isRevenueCatSupportedPlatform()) return false;
  if (!isRevenueCatRuntimeAvailable()) return false;
  if (Platform.OS === 'ios') return Boolean(getRevenueCatIosApiKey());
  return Boolean(process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim());
}

export function getRevenueCatApiKey(): string | undefined {
  if (Platform.OS === 'ios') return getRevenueCatIosApiKey();
  return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim();
}
