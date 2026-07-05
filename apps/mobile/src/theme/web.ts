import { Platform, type TextStyle, type ViewStyle } from 'react-native';

import type { Colors } from './colors';
import { fontBold, fontRegular, fontSemibold } from './fonts';
import { IS_WEB, webOnlyStyle } from '@/lib/webPressableStyles';

/** Expo registers each weight as a separate font-family on web; use normal weight to avoid fallback. */
function webExpoFont(fontFamily: string): Pick<TextStyle, 'fontFamily' | 'fontWeight'> {
  return { fontFamily, fontWeight: 'normal' };
}

/** Web-only design tokens — never import from native code paths. */
export const webMotion = {
  fast: '140ms',
  normal: '220ms',
  slow: '420ms',
  easing: 'cubic-bezier(0.32, 0.72, 0, 1)',
  easingOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const;

export const webTypography = {
  display: {
    ...webExpoFont(fontBold),
    fontSize: 56,
    lineHeight: 62,
    letterSpacing: -1.8,
  },
  displaySm: {
    ...webExpoFont(fontBold),
    fontSize: 44,
    lineHeight: 50,
    letterSpacing: -1.2,
  },
  headline: {
    ...webExpoFont(fontBold),
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.6,
  },
  title: {
    ...webExpoFont(fontBold),
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.4,
  },
  subtitle: {
    ...webExpoFont(fontRegular),
    fontSize: 18,
    lineHeight: 28,
  },
  bodyLg: {
    ...webExpoFont(fontRegular),
    fontSize: 17,
    lineHeight: 26,
  },
  eyebrow: {
    ...webExpoFont(fontSemibold),
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },
} as const;

export type WebShadowLevel = 'subtle' | 'raised' | 'floating' | 'hero';

export function getWebShadow(isDark: boolean, level: WebShadowLevel): string {
  if (level === 'subtle') {
    return isDark
      ? '0 1px 2px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2)'
      : '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)';
  }
  if (level === 'raised') {
    return isDark
      ? '0 2px 4px rgba(0,0,0,0.25), 0 8px 24px rgba(0,0,0,0.28)'
      : '0 2px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.08)';
  }
  if (level === 'floating') {
    return isDark
      ? '0 4px 8px rgba(0,0,0,0.3), 0 16px 40px rgba(0,0,0,0.35)'
      : '0 4px 8px rgba(0,0,0,0.06), 0 16px 40px rgba(0,0,0,0.1)';
  }
  return isDark
    ? '0 8px 16px rgba(0,0,0,0.35), 0 24px 64px rgba(0,0,0,0.4)'
    : '0 8px 16px rgba(0,0,0,0.08), 0 24px 64px rgba(0,0,0,0.12)';
}

export function getWebBorderStyle(colors: Colors, isDark: boolean): ViewStyle {
  return webOnlyStyle({
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    boxShadow: isDark
      ? 'inset 0 1px 0 rgba(255,255,255,0.04)'
      : 'inset 0 1px 0 rgba(255,255,255,0.8)',
  } as ViewStyle);
}

export function getWebFocusRing(primary: string): ViewStyle {
  return webOnlyStyle({
    outlineStyle: 'solid',
    outlineWidth: 2,
    outlineColor: primary,
    outlineOffset: 2,
  } as ViewStyle);
}

export function webTransition(
  properties: string[] = ['opacity', 'transform', 'background-color', 'box-shadow'],
): ViewStyle {
  return webOnlyStyle({
    transitionProperty: properties.join(', '),
    transitionDuration: webMotion.normal,
    transitionTimingFunction: webMotion.easing,
  } as ViewStyle);
}

export function webGlassSurface(colors: Colors, isDark: boolean): ViewStyle {
  return webOnlyStyle({
    backgroundColor: isDark ? 'rgba(28,28,30,0.72)' : 'rgba(255,255,255,0.78)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    boxShadow: getWebShadow(isDark, 'subtle'),
  } as ViewStyle);
}

export function webPageTitleStyle(colors: Colors): TextStyle {
  return {
    ...webTypography.headline,
    color: colors.labelPrimary,
  };
}

export function webSectionEyebrowStyle(colors: Colors): TextStyle {
  return {
    ...webTypography.eyebrow,
    color: colors.primary,
  };
}

/** Returns web typography styles only on web; empty on native. */
export function useWebTypographySafe(): typeof webTypography | null {
  return IS_WEB ? webTypography : null;
}

export function isWebPlatform(): boolean {
  return Platform.OS === 'web';
}
