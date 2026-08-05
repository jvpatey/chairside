import * as Linking from 'expo-linking';
import { Image, Pressable, Text, View } from 'react-native';

import { APP_STORE_URL } from '@/constants';
import { webHover, webOnlyStyle, webPointer, webTextLinkHoverStyles } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

const WEB_SCREENSHOT_LIGHT = require('../../../assets/images/web_screenshot.png');
const WEB_SCREENSHOT_DARK = require('../../../assets/images/web_screenshot_dark.png');
const SCREENSHOT_ASPECT_RATIO = 1556 / 890;

type WelcomeHeroAppPanelProps = {
  enterDelayMs?: number;
};

export function WelcomeHeroAppPanel(_props: WelcomeHeroAppPanelProps = {}) {
  const { isDark } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, isDark: dark }) => ({
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
      bottom: APP_STORE_URL ? '18%' : '4%',
      borderRadius: 32,
      pointerEvents: 'none' as const,
      ...webOnlyStyle({
        // Blue-only wash for clinic-flagship marketing (no purple blend)
        backgroundImage: dark
          ? 'radial-gradient(ellipse 85% 75% at 50% 45%, rgba(74, 154, 255, 0.22) 0%, rgba(74, 154, 255, 0.06) 42%, transparent 72%)'
          : 'radial-gradient(ellipse 85% 75% at 50% 45%, rgba(26, 111, 212, 0.18) 0%, rgba(26, 111, 212, 0.06) 42%, transparent 72%)',
      } as object),
    },
    windowShell: {
      width: '100%',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      overflow: 'hidden' as const,
      ...webOnlyStyle({
        boxShadow: dark
          ? '0 24px 48px rgba(0, 0, 0, 0.35)'
          : '0 20px 40px rgba(26, 111, 212, 0.12)',
      } as object),
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

  const appStoreUrl = APP_STORE_URL;

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
            source={isDark ? WEB_SCREENSHOT_DARK : WEB_SCREENSHOT_LIGHT}
            style={styles.screenshot}
            resizeMode="contain"
            accessibilityRole="image"
            accessibilityLabel="Chairside dashboard showing roles, fill-ins, and applications"
          />
        </View>
      </View>
      {appStoreUrl ? (
        <View style={styles.appPitch}>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Download on the App Store"
            onPress={() => void Linking.openURL(appStoreUrl)}
            style={({ pressed, hovered }) => [
              styles.appStoreLink,
              webHover(hovered, pressed, styles.appStoreLinkHovered),
              pressed && { opacity: 0.75 },
            ]}>
            <Text style={styles.appStoreLinkText}>Download for iPhone</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
