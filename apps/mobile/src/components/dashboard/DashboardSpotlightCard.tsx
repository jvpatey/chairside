import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { DashboardIconBadge } from '@/components/dashboard/DashboardIconBadge';
import type { DashboardSpotlightItem } from '@/lib/dashboardSpotlight';
import { webPointer, webTileHoverStyles } from '@/lib/webPressableStyles';
import {
  fontBold,
  fontRegular,
  fontSemibold,
  useTheme,
  useThemedStyles,
} from '@/theme';

type DashboardSpotlightCardProps = {
  item: DashboardSpotlightItem;
  onDismiss?: () => void;
};

/** Priority spotlight card surfacing the highest-value dashboard action. */
export function DashboardSpotlightCard({ item, onDismiss }: DashboardSpotlightCardProps) {
  const { colors, isDark } = useTheme();
  const brandColor = item.accent === 'secondary' ? colors.secondary : colors.primary;
  const brandSubtle = item.accent === 'secondary' ? colors.secondarySubtle : colors.primarySubtle;

  const styles = useThemedStyles(({ colors, spacing, radii, elevation, isDark }) => ({
    card: {
      borderRadius: radii.lg,
      overflow: 'hidden',
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      ...elevation('raised'),
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      paddingTop: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xs,
    },
    label: {
      fontSize: 12,
      lineHeight: 16,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: brandColor,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radii.pill,
      backgroundColor: brandSubtle,
      overflow: 'hidden',
    },
    dismissButton: {
      width: 28,
      height: 28,
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.fillSubtle,
      ...webPointer(),
    },
    mainPressable: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingTop: spacing.xs,
      paddingBottom: spacing.md + 2,
      paddingHorizontal: spacing.lg,
      minWidth: 0,
      ...webPointer(),
    },
    textColumn: {
      flex: 1,
      minWidth: 0,
      gap: 3,
    },
    headline: {
      fontSize: 16,
      lineHeight: 21,
      fontFamily: fontBold,
      fontWeight: '700',
      color: colors.labelPrimary,
      letterSpacing: -0.25,
    },
    body: {
      fontSize: 14,
      lineHeight: 19,
      fontFamily: fontRegular,
      color: colors.labelSecondary,
    },
    chevron: {
      flexShrink: 0,
      opacity: 0.35,
    },
    cardHovered: webTileHoverStyles(colors, isDark),
    cardPressed: {
      opacity: 0.94,
      transform: [{ scale: 0.99 }],
    },
  }));

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    item.onPress();
  };

  const handleDismiss = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss?.();
  };

  const isWeb = Platform.OS === 'web';

  return (
    <View style={styles.card}>
      <View style={styles.topBar}>
        <Text style={styles.label}>{item.eyebrow}</Text>
        {onDismiss ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            accessibilityHint="Hides this update from your dashboard"
            hitSlop={8}
            onPress={handleDismiss}
            style={styles.dismissButton}>
            <Ionicons name="close" size={14} color={colors.labelSecondary} />
          </Pressable>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${item.headline}. ${item.body}`}
        accessibilityHint={item.ctaLabel}
        onPress={handlePress}
        style={({ pressed, hovered }) => [
          styles.mainPressable,
          isWeb && hovered && !pressed && styles.cardHovered,
          pressed && styles.cardPressed,
        ]}>
        <DashboardIconBadge icon={item.icon} accent={item.accent} size="md" />
        <View style={styles.textColumn}>
          <Text style={styles.headline} numberOfLines={2}>
            {item.headline}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {item.body}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.labelTertiary}
          style={styles.chevron}
        />
      </Pressable>
    </View>
  );
}
