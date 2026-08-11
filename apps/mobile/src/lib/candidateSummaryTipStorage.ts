import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'candidate_summary_packet_tip_dismissed';

export async function isCandidateSummaryTipDismissed(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(STORAGE_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function markCandidateSummaryTipDismissed(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    // Best-effort local tip preference.
  }
}
