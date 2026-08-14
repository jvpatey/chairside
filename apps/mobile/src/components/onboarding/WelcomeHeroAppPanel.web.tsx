import * as Linking from 'expo-linking';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { WelcomeHeroClinicCanvas } from '@/components/onboarding/WelcomeHeroClinicCanvas.web';
import { WelcomeHeroPhonePreview } from '@/components/onboarding/WelcomeHeroPhonePreview.web';
import { APP_STORE_URL } from '@/constants';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { usePrefersReducedMotion } from '@/lib/motion';
import { getWelcomeHeroPreview } from '@/lib/welcomeHeroPreview';
import {
  webHover,
  webOnlyStyle,
  webPointer,
  webTextLinkHoverStyles,
} from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

type WelcomeHeroAppPanelProps = {
  compact?: boolean;
  /** Scale the preview down when it would exceed this height. */
  maxHeight?: number;
  /** Overlay the worker iPhone. Defaults to wide landing, not compact auth. */
  showPhone?: boolean;
};

export function WelcomeHeroAppPanel({
  compact = false,
  maxHeight,
  showPhone: showPhoneProp,
}: WelcomeHeroAppPanelProps) {
  const { isWide } = useResponsiveLayout();
  const reduceMotion = usePrefersReducedMotion();
  const preview = useMemo(() => getWelcomeHeroPreview(), []);
  const showPhone = showPhoneProp ?? (isWide && !compact);
  const appStoreUrl = APP_STORE_URL;
  const [naturalHeight, setNaturalHeight] = useState(0);
  const fitScale =
    maxHeight != null && naturalHeight > 0 ? Math.min(1, maxHeight / naturalHeight) : 1;
  const scaledHeight =
    naturalHeight > 0 && fitScale < 1
      ? naturalHeight * fitScale + (showPhone ? (compact ? 12 : 16) : 0)
      : undefined;

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    wrap: {
      position: 'relative' as const,
      width: '100%',
      alignSelf: 'stretch' as const,
      overflow: showPhone ? ('visible' as const) : ('hidden' as const),
    },
    glow: {
      position: 'absolute' as const,
      top: '8%',
      left: '10%',
      right: '4%',
      bottom: '6%',
      pointerEvents: 'none' as const,
      ...webOnlyStyle({
        backgroundImage: isDark
          ? 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(74, 154, 255, 0.28) 0%, transparent 70%)'
          : 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(26, 111, 212, 0.2) 0%, transparent 70%)',
        filter: 'blur(28px)',
      } as object),
    },
    stage: {
      ...webOnlyStyle({
        perspective: '1600px',
      } as object),
    },
    browser: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      overflow: 'hidden' as const,
      ...webOnlyStyle({
        boxShadow: isDark
          ? '0 24px 48px rgba(0, 0, 0, 0.35)'
          : '0 20px 40px rgba(26, 111, 212, 0.12)',
      } as object),
    },
    chrome: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
      backgroundColor: colors.backgroundGrouped,
    },
    dots: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
    },
    windowDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.fillSubtle,
    },
    urlPill: {
      flex: 1,
      minWidth: 0,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: 5,
      paddingHorizontal: spacing.sm,
      borderRadius: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    urlText: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: colors.labelSecondary,
    },
    canvas: {
      minHeight: 0,
    },
    phone: {
      position: 'absolute' as const,
      right: 0,
      bottom: 0,
      zIndex: 2,
      pointerEvents: 'none' as const,
    },
    appPitch: {
      marginTop: spacing.md,
      alignItems: 'center' as const,
      gap: spacing.xs,
      width: '100%',
    },
    appStoreLink: {
      marginTop: spacing.xs,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: 8,
      ...webPointer(),
    },
    appStoreLinkHovered: webTextLinkHoverStyles(colors),
    appStoreLinkText: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.primary,
    },
  }));

  const browserTilt = reduceMotion || compact
    ? null
    : {
        transform: [{ rotateY: '-8deg' }, { rotateX: '4deg' }] as const,
      };

  const phoneTilt = reduceMotion
    ? null
    : { transform: [{ rotateZ: '-8deg' }] as const };

  return (
    <View
      style={[
        styles.wrap,
        showPhone && { paddingRight: compact ? 28 : 20, paddingBottom: compact ? 12 : 16 },
        scaledHeight != null ? { height: scaledHeight } : null,
      ]}
    >
      <View
        onLayout={(event) => {
          if (fitScale < 1) return;
          const next = event.nativeEvent.layout.height;
          if (next > 0 && Math.abs(next - naturalHeight) > 2) {
            setNaturalHeight(next);
          }
        }}
        style={
          fitScale < 1
            ? {
                transform: [{ scale: fitScale }],
                ...webOnlyStyle({
                  transformOrigin: 'top center',
                } as object),
              }
            : undefined
        }
      >
      <View
        style={styles.glow}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
      <View style={styles.stage}>
        <View
          style={[styles.browser, browserTilt]}
          accessibilityLabel="Chairside product preview: clinic dashboard and professional app"
        >
          <View
            style={styles.chrome}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <View style={styles.dots}>
              <View style={styles.windowDot} />
              <View style={styles.windowDot} />
              <View style={styles.windowDot} />
            </View>
            <View style={styles.urlPill}>
              <Text style={styles.urlText} numberOfLines={1}>
                chairsidedental.app
              </Text>
            </View>
          </View>
          <View style={styles.canvas}>
            <WelcomeHeroClinicCanvas compact={compact} preview={preview} />
          </View>
        </View>
      </View>
      <View style={{ height: showPhone ? (compact ? 52 : 68) : 0 }} />
      {showPhone ? (
        <View style={[styles.phone, phoneTilt]}>
          <WelcomeHeroPhonePreview preview={preview} compact={compact} />
        </View>
      ) : null}
      {appStoreUrl && !compact ? (
        <View style={styles.appPitch}>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Download on the App Store"
            onPress={() => void Linking.openURL(appStoreUrl)}
            style={({ pressed, hovered }) => [
              styles.appStoreLink,
              webHover(hovered, pressed, styles.appStoreLinkHovered),
              pressed && { opacity: 0.75 },
            ]}
          >
            <Text style={styles.appStoreLinkText}>Download for iPhone</Text>
          </Pressable>
        </View>
      ) : null}
      </View>
    </View>
  );
}
