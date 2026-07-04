import * as Linking from 'expo-linking';
import { Image, Pressable, Text, View } from 'react-native';

import {
  APP_STORE_COMING_SOON_HINT,
  APP_STORE_COMING_SOON_LABEL,
  APP_STORE_URL,
} from '@/constants';
import { webHover, webPointer, webTextLinkHoverStyles } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

const WEB_SCREENSHOT = require('../../../assets/images/web_screenshot.png');
const SCREENSHOT_ASPECT_RATIO = 1556 / 890;

type WelcomeHeroAppPanelProps = {
  enterDelayMs?: number;
};

export function WelcomeHeroAppPanel(_props: WelcomeHeroAppPanelProps = {}) {
  const styles = useThemedStyles(({ colors, spacing, typography, isDark }) => ({
    wrap: {
      position: 'relative' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      width: '100%',
      alignSelf: 'stretch' as const,
    },
    glow: {
      position: 'absolute' as const,
      top: '6%',
      left: '4%',
      right: '4%',
      bottom: '18%',
      borderRadius: 32,
      // @ts-expect-error — web-only gradient
      backgroundImage: isDark
        ? 'radial-gradient(ellipse 85% 75% at 50% 45%, rgba(74, 154, 255, 0.22) 0%, rgba(152, 150, 255, 0.08) 42%, transparent 72%)'
        : 'radial-gradient(ellipse 85% 75% at 50% 45%, rgba(26, 111, 212, 0.18) 0%, rgba(88, 86, 214, 0.08) 42%, transparent 72%)',
      pointerEvents: 'none' as const,
    },
    windowShell: {
      width: '100%',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      overflow: 'hidden' as const,
      // @ts-expect-error — web-only
      boxShadow: isDark
        ? '0 24px 48px rgba(0, 0, 0, 0.35)'
        : '0 20px 40px rgba(26, 111, 212, 0.12)',
    },
    windowChrome: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
      backgroundColor: colors.backgroundGrouped,
    },
    windowDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.fillSubtle,
    },
    screenshotFrame: {
      width: '100%',
      aspectRatio: SCREENSHOT_ASPECT_RATIO,
      backgroundColor: colors.backgroundGrouped,
    },
    screenshot: {
      width: '100%',
      height: '100%',
      // @ts-expect-error — objectFit is web-only
      objectFit: 'contain',
    },
    appPitch: {
      marginTop: spacing.md,
      alignItems: 'center' as const,
      gap: spacing.xs,
      width: '100%',
    },
    appPitchTitle: {
      ...typography.body,
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
      textAlign: 'center' as const,
    },
    appPitchHint: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
      textAlign: 'center' as const,
      maxWidth: 320,
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

  const appStoreContent = APP_STORE_URL ? (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel="Download on the App Store"
      onPress={() => void Linking.openURL(APP_STORE_URL)}
      style={({ pressed, hovered }) => [
        styles.appStoreLink,
        webHover(hovered, pressed, styles.appStoreLinkHovered),
        pressed && { opacity: 0.75 },
      ]}>
      <Text style={styles.appStoreLinkText}>Download for iPhone</Text>
    </Pressable>
  ) : (
    <Text style={styles.appPitchTitle}>{APP_STORE_COMING_SOON_LABEL}</Text>
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.glow} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      <View style={styles.windowShell}>
        <View style={styles.windowChrome} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={styles.windowDot} />
          <View style={styles.windowDot} />
          <View style={styles.windowDot} />
        </View>
        <View style={styles.screenshotFrame}>
          <Image
            source={WEB_SCREENSHOT}
            style={styles.screenshot}
            resizeMode="contain"
            accessibilityRole="image"
            accessibilityLabel="Chairside dashboard showing roles, fill-ins, and applications"
          />
        </View>
      </View>
      <View style={styles.appPitch}>
        {appStoreContent}
        <Text style={styles.appPitchHint}>{APP_STORE_COMING_SOON_HINT}</Text>
      </View>
    </View>
  );
}
