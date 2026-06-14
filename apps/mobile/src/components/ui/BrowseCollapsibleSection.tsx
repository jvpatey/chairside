import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { fontSemibold, useTheme, useThemedStyles } from '@/theme';
import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';

type BrowseCollapsibleSectionProps = {
  title: string;
  count: number;
  defaultExpanded?: boolean;
  children: ReactNode;
};

export function BrowseCollapsibleSection({
  title,
  count,
  defaultExpanded = true,
  children,
}: BrowseCollapsibleSectionProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);

  const styles = useThemedStyles(({ spacing, typography }) => ({
    section: {
      gap: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 8,
      ...webPointer(),
    },
    headerHovered: webListRowHoverStyles(colors),
    headerPressed: {
      opacity: 0.88,
    },
    title: {
      ...typography.label,
      fontFamily: fontSemibold,
      fontSize: 13,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: typography.subtitle.color,
      flex: 1,
    },
    chevron: {
      flexShrink: 0,
    },
  }));

  const accessibilityAction = expanded ? 'Collapse' : 'Expand';

  return (
    <View style={styles.section}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${accessibilityAction} ${title}`}
        accessibilityState={{ expanded }}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setExpanded((current) => !current);
        }}
        style={({ pressed, hovered }) => [
          styles.header,
          webHover(hovered, pressed, styles.headerHovered),
          pressed && styles.headerPressed,
        ]}>
        <Text style={styles.title}>
          {title} · {count}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.labelTertiary}
          style={styles.chevron}
        />
      </Pressable>
      {expanded ? children : null}
    </View>
  );
}
