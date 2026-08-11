import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colorWithAlpha, useThemedStyles } from '@/theme';

type CardSectionDividerProps = {
  /** Right inset so the rule doesn’t run edge-to-edge. */
  insetEnd?: number;
};

/** Quiet hairline between card header and body (dashboard role / fill-in / application cards). */
export function CardSectionDivider({ insetEnd = 0 }: CardSectionDividerProps) {
  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    wrap: {
      alignSelf: 'stretch' as const,
      paddingVertical: spacing.xs + 2,
      paddingRight: insetEnd,
    },
    line: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colorWithAlpha(colors.labelPrimary, isDark ? 0.06 : 0.05),
      alignSelf: 'stretch' as const,
    },
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.line} />
    </View>
  );
}

type CardContentSectionProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Body region below the card header divider. */
export function CardContentSection({ children, style }: CardContentSectionProps) {
  const styles = useThemedStyles(({ spacing }) => ({
    section: {
      gap: spacing.sm,
      paddingTop: spacing.xs,
    },
  }));

  return <View style={[styles.section, style]}>{children}</View>;
}
