import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import type { DashboardSpotlightItem } from '@/lib/dashboardSpotlight';
import { webOnlyStyle, webPointer, webTileHoverStyles } from '@/lib/webPressableStyles';
import {
  colorWithAlpha,
  fontBold,
  fontRegular,
  fontSemibold,
  getSpotlightGradient,
  useTheme,
  useThemedStyles,
} from '@/theme';

type DashboardSpotlightCardProps = {
  item: DashboardSpotlightItem;
};

/** Prominent "Up next" card surfacing the highest-priority dashboard action. */
export function DashboardSpotlightCard({ item }: DashboardSpotlightCardProps) {
  const { colors, isDark } = useTheme();
  const brandColor = item.accent === 'secondary' ? colors.secondary : colors.primary;
  const gradientColors = getSpotlightGradient(colors, isDark, item.accent);

  const styles = useThemedStyles(({ colors, spacing, radii, elevation, isDark }) => ({
    card: {
      borderRadius: radii.xl,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colorWithAlpha(brandColor, isDark ? 0.34 : 0.22),
      ...elevation('raised'),
      ...webPointer(),
    },
    gradient: {
      ...StyleSheet.absoluteFillObject,
    },
    content: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colorWithAlpha(brandColor, isDark ? 0.24 : 0.16),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colorWithAlpha(brandColor, isDark ? 0.32 : 0.24),
      flexShrink: 0,
    },
    textBlock: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
    },
    eyebrow: {
      fontSize: 12,
      lineHeight: 16,
      fontFamily: fontSemibold,
      fontWeight: '600',
      letterSpacing: 0.6,
      textTransform: 'uppercase' as const,
      color: brandColor,
    },
    headline: {
      fontSize: 20,
      lineHeight: 26,
      fontFamily: fontBold,
      fontWeight: '700',
      color: colors.labelPrimary,
      letterSpacing: -0.4,
    },
    body: {
      fontSize: 15,
      lineHeight: 22,
      fontFamily: fontRegular,
      color: colors.labelSecondary,
    },
    ctaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    cta: {
      fontSize: 15,
      lineHeight: 20,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: brandColor,
    },
    cardHovered: webTileHoverStyles(colors, isDark),
    cardPressed: {
      opacity: 0.92,
      transform: [{ scale: 0.985 }],
    },
    focusRing: webOnlyStyle({
      outlineStyle: 'solid',
      outlineWidth: 2,
      outlineColor: colorWithAlpha(brandColor, 0.45),
      outlineOffset: 2,
    }),
  }));

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    item.onPress();
  };

  const isWeb = Platform.OS === 'web';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.eyebrow}. ${item.headline}. ${item.body}`}
      onPress={handlePress}
      style={({ pressed, hovered }) => [
        styles.card,
        isWeb && hovered && !pressed && styles.cardHovered,
        pressed && styles.cardPressed,
      ]}>
      <LinearGradient colors={gradientColors} style={styles.gradient} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.iconWrap}>
            <Ionicons name={item.icon} size={22} color={brandColor} />
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.eyebrow}>{item.eyebrow}</Text>
            <Text style={styles.headline} numberOfLines={2}>
              {item.headline}
            </Text>
            <Text style={styles.body} numberOfLines={3}>
              {item.body}
            </Text>
          </View>
        </View>
        <View style={styles.ctaRow}>
          <Text style={styles.cta}>{item.ctaLabel}</Text>
          <Ionicons name="arrow-forward" size={16} color={brandColor} />
        </View>
      </View>
    </Pressable>
  );
}
