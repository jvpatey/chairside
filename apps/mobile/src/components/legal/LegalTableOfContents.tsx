import { Pressable, Text, View } from 'react-native';

import type { LegalSection } from '@/content/legal/types';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';
import { getElevationStyle, radii } from '@/theme/tokens';
import { getWebShadow } from '@/theme/web';

type LegalTableOfContentsProps = {
  sections: LegalSection[];
  onSelectSection: (title: string) => void;
  variant?: 'default' | 'web';
};

export function LegalTableOfContents({
  sections,
  onSelectSection,
  variant = 'default',
}: LegalTableOfContentsProps) {
  const { isCompact } = useResponsiveLayout();
  const { isDark } = useTheme();
  const isWebVariant = variant === 'web';

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: isWebVariant ? radii.xxl : isCompact ? 12 : radii.lg,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: isCompact && !isWebVariant ? spacing.md : spacing.lg,
      marginBottom: isWebVariant ? 0 : isCompact ? spacing.lg : spacing.xl,
      gap: isCompact && !isWebVariant ? spacing.sm : spacing.md,
      ...(isWebVariant
        ? { boxShadow: getWebShadow(isDark, 'raised') }
        : getElevationStyle({ isDark, level: 'subtle' })),
    },
    heading: {
      ...typography.body,
      fontSize: isWebVariant ? 14 : isCompact ? 15 : 16,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
      letterSpacing: isWebVariant ? 0.2 : 0,
    },
    list: {
      gap: isCompact && !isWebVariant ? 0 : spacing.xs,
    },
    itemPressable: {
      paddingVertical: isCompact && !isWebVariant ? spacing.xs : spacing.sm,
      paddingHorizontal: spacing.sm,
      marginHorizontal: -spacing.sm,
      borderRadius: radii.sm,
      minHeight: isCompact && !isWebVariant ? 40 : undefined,
      justifyContent: 'center' as const,
      ...webPointer(),
    },
    itemHovered: webListRowHoverStyles(colors),
    itemText: {
      ...typography.body,
      fontSize: isCompact && !isWebVariant ? 14 : 15,
      lineHeight: isCompact && !isWebVariant ? 20 : 22,
      color: colors.primary,
      fontWeight: '500' as const,
    },
  }));

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>On this page</Text>
      <View style={styles.list}>
        {sections.map((section) => (
          <Pressable
            key={section.title}
            accessibilityRole="link"
            accessibilityLabel={`Jump to ${section.title}`}
            onPress={() => onSelectSection(section.title)}
            style={({ pressed, hovered }) => [
              styles.itemPressable,
              webHover(hovered, pressed, styles.itemHovered),
              pressed && { opacity: 0.88 },
            ]}>
            <Text style={styles.itemText}>{section.title}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
