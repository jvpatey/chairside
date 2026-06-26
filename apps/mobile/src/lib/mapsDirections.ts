import { Alert, Linking, Platform } from 'react-native';

import {
  buildAppleMapsDirectionsUrl,
  buildGoogleMapsDirectionsUrl,
  type MapsDestination,
} from '@/lib/mapsDirectionsUrls';

export type { MapsDestination } from '@/lib/mapsDirectionsUrls';
export { buildAppleMapsDirectionsUrl, buildGoogleMapsDirectionsUrl } from '@/lib/mapsDirectionsUrls';

export function buildNativeMapsDirectionsUrl(destination: MapsDestination): string | null {
  if (Platform.OS === 'ios') {
    return buildAppleMapsDirectionsUrl(destination);
  }
  return buildGoogleMapsDirectionsUrl(destination);
}

export async function openMapsDirections(
  destination: MapsDestination,
  provider: 'apple' | 'google' | 'native' = 'native',
): Promise<void> {
  const url =
    provider === 'apple'
      ? buildAppleMapsDirectionsUrl(destination)
      : provider === 'google'
        ? buildGoogleMapsDirectionsUrl(destination)
        : buildNativeMapsDirectionsUrl(destination);

  if (!url) {
    Alert.alert('Address unavailable', 'This clinic has not added a mappable address yet.');
    return;
  }

  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Cannot open maps', 'Please try again.');
  }
}

export function shouldShowAppleMapsLink(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'web';
}

export function shouldShowGoogleMapsLink(): boolean {
  return true;
}
