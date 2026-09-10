import { Ionicons } from '@expo/vector-icons';
import { type ReactNode, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { webHover, webPointer } from '@/lib/webPressableStyles';
import { fontBold, fontSemibold, useTheme, useThemedStyles } from '@/theme';

type AdminCollapsibleSectionProps = {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  /** Optional muted one-liner under the title when expanded. */
  subtitle?: string;
};

export function AdminCollapsibleSection({
  title,
  children,
  defaultExpanded = true,
  subtitle,
}: AdminCollapsibleSectionProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);

  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    root: {
      gap: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingVertical: 6,
      paddingHorizontal: 4,
      borderRadius: radii.sm,
      ...webPointer(),
    },
    headerHovered: {
      backgroundColor: colors.fillSubtle,
    },
    titleBlock: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    title: {
      fontFamily: fontBold,
      fontSize: 14,
      letterSpacing: 0.3,
      textTransform: 'uppercase',
      color: colors.labelSecondary,
    },
    subtitle: {
      fontFamily: fontSemibold,
      fontSize: 12,
      color: colors.labelTertiary,
    },
    chevron: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.fillSubtle,
    },
    body: {
      gap: spacing.md,
    },
  }));

  return (
    <View style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} ${title}`}
        onPress={() => setExpanded((prev) => !prev)}
        style={({ hovered, pressed }) => [
          styles.header,
          webHover(hovered, pressed, styles.headerHovered),
        ]}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{title}</Text>
          {expanded && subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <View style={styles.chevron}>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.labelSecondary}
          />
        </View>
      </Pressable>
      {expanded ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}
