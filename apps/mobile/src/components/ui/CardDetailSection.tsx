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
  const styles = useThemedStyles(({ colors, spacing }) => ({
    section: {
      gap: spacing.md,
      ...(divided
        ? {
            paddingTop: spacing.md,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.separator,
          }
        : null),
    },
    title: {
      fontSize: 15,
      lineHeight: 20,
      fontFamily: fontSemibold,
      fontWeight: '600',
      letterSpacing: -0.2,
      color: colors.labelPrimary,
    },
    body: {
      gap: spacing.xs,
    },
  }));

  return (
    <View style={styles.section}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.body}>{children}</View>
    </View>
  );
}
