import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { FadeInSection } from '@/components/dashboard/FadeInSection';
import { resolveAccentColor } from '@/lib/accentColors';
import { webPointer, webTileHoverStyles } from '@/lib/webPressableStyles';
import { fontSemibold, useTheme, useThemedStyles, type GradientAccent } from '@/theme';

export type DashboardAttentionItem = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent?: GradientAccent;
  urgent?: boolean;
  onPress: () => void;
};

type DashboardNeedsAttentionProps = {
  items: DashboardAttentionItem[];
};

/** Horizontal strip of time-sensitive dashboard actions. */
export function DashboardNeedsAttention({ items }: DashboardNeedsAttentionProps) {
  const { colors, isDark } = useTheme();
  const isWeb = Platform.OS === 'web';

  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    wrap: {
      gap: spacing.sm,
    },
    title: {
      fontSize: 13,
      lineHeight: 18,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelSecondary,
      letterSpacing: 0.2,
      textTransform: 'uppercase' as const,
    },
    scroll: {
      flexGrow: 0,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingVertical: 2,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radii.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
      maxWidth: 280,
      ...webPointer(),
    },
    chipUrgent: {
      borderColor: `${colors.destructive}40`,
      backgroundColor: `${colors.destructive}08`,
    },
    chipLabel: {
      fontSize: 14,
      lineHeight: 18,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelPrimary,
      flexShrink: 1,
    },
    chipHovered: webTileHoverStyles(colors, isDark),
    chipPressed: {
      opacity: 0.88,
    },
  }));

  if (items.length === 0) return null;

  return (
    <FadeInSection delayMs={40}>
      <View style={styles.wrap}>
        <Text style={styles.title}>Needs attention</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scroll}
          contentContainerStyle={styles.row}>
          {items.map((item) => {
            const accentColor = resolveAccentColor(colors, item.accent ?? 'primary');
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  item.onPress();
                }}
                style={({ pressed, hovered }) => [
                  styles.chip,
                  item.urgent && styles.chipUrgent,
                  isWeb && hovered && !pressed && styles.chipHovered,
                  pressed && styles.chipPressed,
                ]}>
                <Ionicons
                  name={item.icon}
                  size={16}
                  color={item.urgent ? colors.destructive : accentColor}
                />
                <Text style={styles.chipLabel} numberOfLines={1}>
                  {item.label}
                </Text>
                <Ionicons name="chevron-forward" size={14} color={colors.labelTertiary} />
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </FadeInSection>
  );
}
