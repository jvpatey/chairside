import * as SplashScreen from 'expo-splash-screen';

const BOOT_SPLASH_FALLBACK_MS = 5000;

let hidePromise: Promise<void> | null = null;
let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
let fallbackArmed = false;

/** Hide the native splash once. Safe to call multiple times. */
export function hideBootSplash(): Promise<void> {
  if (!hidePromise) {
    if (fallbackTimer) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
    hidePromise = SplashScreen.hideAsync().catch(() => {});
  }
  return hidePromise;
}

/**
 * Arm a fallback so splash cannot stick forever if route resolution hangs.
 * Call once from root layout after fonts are ready.
 */
export function armBootSplashFallback(timeoutMs = BOOT_SPLASH_FALLBACK_MS): void {
  if (fallbackArmed || hidePromise) return;
  fallbackArmed = true;
  fallbackTimer = setTimeout(() => {
    void hideBootSplash();
  }, timeoutMs);
}
