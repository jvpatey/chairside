import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Pressable, Text, View } from 'react-native';

import {
  APP_STORE_COMING_SOON_HINT,
  APP_STORE_COMING_SOON_LABEL,
  APP_STORE_URL,
} from '@/constants';
import { webHover, webPointer, webTextLinkHoverStyles } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

const APP_HIGHLIGHTS = [
  { icon: 'notifications-outline' as const, label: 'Fill-in alerts' },
  { icon: 'briefcase-outline' as const, label: 'Apply with your kit' },
  { icon: 'chatbubble-outline' as const, label: 'Message clinics' },
] as const;

type WelcomeHeroAppPanelProps = {
  enterDelayMs?: number;
};

export function WelcomeHeroAppPanel(_props: WelcomeHeroAppPanelProps = {}) {
  const { colors } = useTheme();

  const styles = useThemedStyles(({ colors, spacing, typography, isDark }) => ({
    wrap: {
      flex: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minWidth: 280,
      maxWidth: 380,
      width: '100%',
    },
    phoneShell: {
      width: '100%',
      maxWidth: 320,
      borderRadius: 32,
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      padding: spacing.sm,
      gap: spacing.sm,
      // @ts-expect-error — web-only
      boxShadow: isDark
        ? '0 24px 48px rgba(0, 0, 0, 0.35)'
        : '0 20px 40px rgba(26, 111, 212, 0.12)',
    },
    phoneNotch: {
      alignSelf: 'center' as const,
      width: 96,
      height: 6,
      borderRadius: 999,
      backgroundColor: colors.separator,
      marginBottom: spacing.xs,
    },
    phoneScreen: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.backgroundGrouped,
      padding: spacing.md,
      gap: spacing.md,
      minHeight: 280,
    },
    screenHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    screenAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primarySubtle,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    screenHeaderText: {
      flex: 1,
      gap: 4,
    },
    screenLinePrimary: {
      height: 10,
      width: '55%',
      borderRadius: 4,
      backgroundColor: colors.fillSubtle,
    },
    screenLineSecondary: {
      height: 8,
      width: '40%',
      borderRadius: 4,
      backgroundColor: colors.fillSubtle,
      opacity: 0.7,
    },
    screenCard: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.sm,
    },
    screenCardRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    screenCardIcon: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: colors.primarySubtle,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    screenCardLine: {
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.fillSubtle,
    },
    highlights: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.xs,
      justifyContent: 'center' as const,
    },
    highlightChip: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: spacing.sm,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
    },
    highlightText: {
      fontSize: 12,
      fontWeight: '500' as const,
      color: colors.labelSecondary,
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
      maxWidth: 280,
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
      <View style={styles.phoneShell}>
        <View style={styles.phoneNotch} />
        <View style={styles.phoneScreen}>
          <View style={styles.screenHeader}>
            <View style={styles.screenAvatar}>
              <Ionicons name="medical-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.screenHeaderText}>
              <View style={styles.screenLinePrimary} />
              <View style={styles.screenLineSecondary} />
            </View>
          </View>
          <View style={styles.screenCard}>
            <View style={styles.screenCardRow}>
              <View style={styles.screenCardIcon}>
                <Ionicons name="flash-outline" size={16} color={colors.primary} />
              </View>
              <View style={[styles.screenCardLine, { width: '70%' }]} />
            </View>
            <View style={styles.screenCardRow}>
              <View style={styles.screenCardIcon}>
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              </View>
              <View style={[styles.screenCardLine, { width: '55%' }]} />
            </View>
          </View>
          <View style={styles.highlights}>
            {APP_HIGHLIGHTS.map(({ icon, label }) => (
              <View key={label} style={styles.highlightChip}>
                <Ionicons name={icon} size={13} color={colors.primary} />
                <Text style={styles.highlightText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      <View style={styles.appPitch}>
        {appStoreContent}
        <Text style={styles.appPitchHint}>{APP_STORE_COMING_SOON_HINT}</Text>
      </View>
    </View>
  );
}
