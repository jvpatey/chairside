import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { webOnlyStyle } from '@/lib/webPressableStyles';
import { getGlassTokens, useTheme } from '@/theme';

type LiquidGlassSurfaceProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
  /** Overrides the default glass overlay tint (web/iOS). */
  overlayColor?: string;
  /** Web only — backdrop blur needs content behind the panel; disable when the surface floats over empty layout. */
  backdropBlur?: boolean;
};

/**
 * Top-layer translucent material for navigation and floating controls.
 * Uses native blur on iOS, CSS backdrop-filter on web, and a solid elevated
 * fallback on Android where blur is experimental and inconsistent.
 */
export function LiquidGlassSurface({
  children,
  style,
  borderRadius = 28,
  overlayColor,
  backdropBlur = true,
}: LiquidGlassSurfaceProps) {
  const { isDark } = useTheme();
  const glass = getGlassTokens(isDark);
  const overlay = overlayColor ?? glass.overlay;

  const shellStyle: ViewStyle = {
    borderRadius,
    overflow: 'hidden',
    borderWidth: Platform.OS === 'ios' ? StyleSheet.hairlineWidth : 1,
    borderColor: glass.border,
    ...webOnlyStyle({
      boxShadow: isDark ? glass.shadowDark : glass.shadowLight,
    } as ViewStyle),
    ...(Platform.OS === 'android' ? { elevation: 8 } : {}),
  };

  if (Platform.OS === 'android') {
    return (
      <View style={[shellStyle, { backgroundColor: glass.fallbackBackground }, style]}>
        {children}
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          shellStyle,
          {
            backgroundColor: overlay,
            ...(backdropBlur
              ? webOnlyStyle({
                  backdropFilter: glass.backdropFilter,
                  WebkitBackdropFilter: glass.backdropFilter,
                } as ViewStyle)
              : {}),
          },
          style,
        ]}>
        {children}
      </View>
    );
  }

  // iOS (and other native platforms with BlurView support)
  return (
    <View style={[shellStyle, style]}>
      <BlurView
        intensity={glass.blurIntensity}
        tint={glass.blurTint}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: overlay }]}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}
