import { Pressable, Text, View } from 'react-native';

import type { LegalSection } from '@/content/legal/types';
import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

type LegalTableOfContentsProps = {
  sections: LegalSection[];
  onSelectSection: (title: string) => void;
};

export function LegalTableOfContents({ sections, onSelectSection }: LegalTableOfContentsProps) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      marginBottom: spacing.xl,
      gap: spacing.md,
    },
    heading: {
      ...typography.body,
      fontSize: 16,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
    },
    list: {
      gap: spacing.xs,
    },
    itemPressable: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      marginHorizontal: -spacing.sm,
      borderRadius: 10,
      ...webPointer(),
    },
    itemHovered: webListRowHoverStyles(colors),
    itemText: {
      ...typography.body,
      fontSize: 15,
      lineHeight: 22,
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
