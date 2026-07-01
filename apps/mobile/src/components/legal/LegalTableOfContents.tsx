import { Pressable, Text, View } from 'react-native';

import type { LegalSection } from '@/content/legal/types';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

type LegalTableOfContentsProps = {
  sections: LegalSection[];
  onSelectSection: (title: string) => void;
};

export function LegalTableOfContents({ sections, onSelectSection }: LegalTableOfContentsProps) {
  const { isCompact } = useResponsiveLayout();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: isCompact ? 12 : 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: isCompact ? spacing.md : spacing.lg,
      marginBottom: isCompact ? spacing.lg : spacing.xl,
      gap: isCompact ? spacing.sm : spacing.md,
    },
    heading: {
      ...typography.body,
      fontSize: isCompact ? 15 : 16,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
    },
    list: {
      gap: isCompact ? 0 : spacing.xs,
    },
    itemPressable: {
      paddingVertical: isCompact ? spacing.xs : spacing.sm,
      paddingHorizontal: spacing.sm,
      marginHorizontal: -spacing.sm,
      borderRadius: 10,
      minHeight: isCompact ? 40 : undefined,
      justifyContent: 'center' as const,
      ...webPointer(),
    },
    itemHovered: webListRowHoverStyles(colors),
    itemText: {
      ...typography.body,
      fontSize: isCompact ? 14 : 15,
      lineHeight: isCompact ? 20 : 22,
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
