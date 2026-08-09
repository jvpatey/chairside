import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FadeInSection } from '@/components/dashboard/FadeInSection';
import { resolveAccentColor, resolveAccentSubtle } from '@/lib/accentColors';
import { webPointer, webTileHoverStyles } from '@/lib/webPressableStyles';
import {
  fontRegular,
  fontSemibold,
  useTheme,
  useThemedStyles,
  type GradientAccent,
} from '@/theme';
import { getElevationStyle } from '@/theme/tokens';

export type DashboardAttentionItem = {
  id: string;
  label: string;
  description?: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent?: GradientAccent;
  urgent?: boolean;
  onPress: () => void;
};

type DashboardNeedsAttentionProps = {
  items: DashboardAttentionItem[];
};

type AttentionCardProps = {
  item: DashboardAttentionItem;
  fullWidth?: boolean;
};

function AttentionCard({ item, fullWidth = false }: AttentionCardProps) {
  const { colors, isDark } = useTheme();
  const isWeb = Platform.OS === 'web';
  const accent = item.accent ?? 'primary';
  const accentColor = item.urgent ? colors.destructive : resolveAccentColor(colors, accent);
  const accentSubtle = item.urgent ? `${colors.destructive}12` : resolveAccentSubtle(colors, accent);

  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    tile: {
      borderRadius: radii.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: item.urgent ? `${colors.destructive}40` : colors.separator,
      backgroundColor: item.urgent ? `${colors.destructive}06` : colors.surface,
      minHeight: 76,
      justifyContent: 'center',
      minWidth: fullWidth ? undefined : 240,
      width: fullWidth ? ('100%' as const) : undefined,
      ...getElevationStyle({ isDark, level: 'subtle' }),
      ...webPointer(),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minWidth: 0,
    },
    iconBadge: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      backgroundColor: accentSubtle,
    },
    textBlock: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    label: {
      fontSize: 15,
      lineHeight: 20,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelPrimary,
      letterSpacing: -0.2,
    },
    description: {
      fontSize: 12,
      lineHeight: 16,
      fontFamily: fontRegular,
      color: colors.labelTertiary,
    },
    chevron: {
      flexShrink: 0,
      opacity: 0.45,
    },
    tileHovered: webTileHoverStyles(colors, isDark),
    tilePressed: {
      opacity: 0.88,
    },
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        item.description ? `${item.label}. ${item.description}` : item.label
      }
      accessibilityHint="Opens this section of the app"
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        item.onPress();
      }}
      style={({ pressed, hovered }) => [
        styles.tile,
        isWeb && hovered && !pressed && styles.tileHovered,
        pressed && styles.tilePressed,
      ]}>
      <View style={styles.row}>
        <View style={styles.iconBadge}>
          <Ionicons name={item.icon} size={18} color={accentColor} />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.label} numberOfLines={1}>
            {item.label}
          </Text>
          {item.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.labelTertiary}
          style={styles.chevron}
        />
      </View>
    </Pressable>
  );
}

/** Time-sensitive dashboard actions styled like quick-action tiles. */
export function DashboardNeedsAttention({ items }: DashboardNeedsAttentionProps) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    wrap: {
      gap: spacing.sm,
    },
    title: {
      fontSize: 15,
      lineHeight: 20,
      fontFamily: fontSemibold,
      fontWeight: '600',
      letterSpacing: -0.2,
      color: colors.labelPrimary,
    },
    scroll: {
      flexGrow: 0,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
  }));

  if (items.length === 0) return null;

  const cards = items.map((item) => (
    <AttentionCard key={item.id} item={item} fullWidth={items.length === 1} />
  ));

  return (
    <FadeInSection delayMs={40}>
      <View style={styles.wrap}>
        <Text style={styles.title}>Needs attention</Text>
        {items.length === 1 ? (
          cards
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.scroll}
            contentContainerStyle={styles.row}>
            {cards}
          </ScrollView>
        )}
      </View>
    </FadeInSection>
  );
}
