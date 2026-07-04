export type GlassTokens = {
  /** Semi-transparent overlay on top of blur (iOS/web). */
  overlay: string;
  /** Solid fallback when blur is unavailable (Android). */
  fallbackBackground: string;
  border: string;
  shadowLight: string;
  shadowDark: string;
  /** Web backdrop-filter value. */
  backdropFilter: string;
  blurIntensity: number;
  blurTint: 'light' | 'dark' | 'default';
};

export function getGlassTokens(isDark: boolean): GlassTokens {
  if (isDark) {
    return {
      overlay: 'rgba(44, 44, 46, 0.72)',
      fallbackBackground: '#2C2C2EE6',
      border: 'rgba(255, 255, 255, 0.12)',
      shadowLight: '0 8px 24px rgba(0, 0, 0, 0.35)',
      shadowDark: '0 8px 24px rgba(0, 0, 0, 0.35)',
      backdropFilter: 'blur(20px) saturate(180%)',
      blurIntensity: 40,
      blurTint: 'dark',
    };
  }

  return {
    overlay: 'rgba(255, 255, 255, 0.72)',
    fallbackBackground: '#FFFFFFF2',
    border: 'rgba(60, 60, 67, 0.18)',
    shadowLight: '0 10px 32px rgba(0, 0, 0, 0.1)',
    shadowDark: '0 10px 32px rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(20px) saturate(180%)',
    blurIntensity: 50,
    blurTint: 'light',
  };
}
