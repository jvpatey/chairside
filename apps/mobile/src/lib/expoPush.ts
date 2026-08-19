import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** True when native push registration can run (EAS / standalone), not Expo Go. */
export function isNativePushAvailable(): boolean {
  if (Platform.OS === 'web') return false;
  if (Constants.executionEnvironment === 'storeClient') return false;
  if (Constants.appOwnership === 'expo') return false;
  return true;
}

export function getExpoProjectId(): string | null {
  const fromEas = Constants.expoConfig?.extra?.eas?.projectId;
  if (typeof fromEas === 'string' && fromEas.trim()) return fromEas.trim();

  const fromConstants = Constants.easConfig?.projectId;
  if (typeof fromConstants === 'string' && fromConstants.trim()) {
    return fromConstants.trim();
  }

  return null;
}
