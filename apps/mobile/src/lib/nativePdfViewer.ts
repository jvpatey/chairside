import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** True when react-native-pdf is available (EAS / standalone), not Expo Go. */
export function isNativePdfViewerAvailable(): boolean {
  if (Platform.OS === 'web') return false;
  if (Constants.executionEnvironment === 'storeClient') return false;
  if (Constants.appOwnership === 'expo') return false;
  return true;
}
