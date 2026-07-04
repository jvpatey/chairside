import { Platform } from 'react-native';
import { Easing, FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';

const STAGGER_MS = 90;
const ENTER_DURATION_MS = 450;
const REDUCED_MOTION_DURATION_MS = 220;

export const WELCOME_STAGGER = {
  wordmark: 0,
  headline: STAGGER_MS,
  subtitle: STAGGER_MS * 2,
  cards: STAGGER_MS * 3,
  primaryCta: STAGGER_MS * 4 + 40,
  secondaryCta: STAGGER_MS * 5 + 40,
} as const;

export const AUTH_STAGGER = {
  header: 0,
  social: STAGGER_MS,
  form: STAGGER_MS * 2,
  primaryCta: STAGGER_MS * 3,
  switchRow: STAGGER_MS * 4,
} as const;

/** Per-index delay for lists of cards (e.g. role options). */
export function authCardDelay(index: number) {
  return AUTH_STAGGER.social + index * STAGGER_MS;
}

/**
 * Fade + rise entrance. Returns undefined on web, where WebPageEnter
 * already animates the page and a second entrance would double up.
 */
export function enterFadeUp(delayMs: number, reducedMotion: boolean | null) {
  if (Platform.OS === 'web') return undefined;

  if (reducedMotion) {
    return FadeIn.duration(REDUCED_MOTION_DURATION_MS).delay(delayMs);
  }

  return FadeInDown.duration(ENTER_DURATION_MS)
    .delay(delayMs)
    .easing(Easing.out(Easing.cubic));
}

/** Spring-settled rise used for floating card clusters. */
export function enterSpringUp(delayMs: number, reducedMotion: boolean | null) {
  if (Platform.OS === 'web') return undefined;

  if (reducedMotion) {
    return FadeIn.duration(REDUCED_MOTION_DURATION_MS).delay(delayMs);
  }

  return FadeInUp.duration(500).delay(delayMs).springify().damping(16).stiffness(120);
}
