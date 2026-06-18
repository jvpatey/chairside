import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { fontSemibold, useThemedStyles } from '@/theme';

type CardDetailSectionProps = {
  title?: string;
  children: ReactNode;
  /** Adds a top divider when nested below other card content. */
  divided?: boolean;
};

/**
 * Grouped section inside expanded cards — label + body with consistent rhythm.
 */
export function CardDetailSection({
  title,
  children,
  divided = false,
}: CardDetailSectionProps) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    section: {
      gap: spacing.sm,
      ...(divided
        ? {
            paddingTop: spacing.md,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.separator,
          }
        : null),
    },
    title: {
      ...typography.label,
      fontFamily: fontSemibold,
      fontSize: 13,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.labelSecondary,
    },
    body: {
      gap: spacing.sm,
    },
  }));

  return (
    <View style={styles.section}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.body}>{children}</View>
    </View>
  );
}
