import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** True when @notificationapi/react-native can run (EAS / standalone), not Expo Go. */
export function isNativePushAvailable(): boolean {
  if (Platform.OS === 'web') return false;
  if (Constants.executionEnvironment === 'storeClient') return false;
  if (Constants.appOwnership === 'expo') return false;
  return true;
}
