import type { ReactNode } from 'react';
import { View } from 'react-native';

import { ChairsideWordmark } from '@/components/brand/ChairsideWordmark';
import { dashboardHeaderStackGap } from '@/components/dashboard/dashboardLayout';
import { useThemedStyles } from '@/theme';

type DashboardBrandHeaderProps = {
  /** Greeting on the first text line below the wordmark row. */
  leading?: ReactNode;
  /** Profile and notification actions inline with the wordmark on the right. */
  trailing?: ReactNode;
  /** Display name on the second text line. */
  nameLine?: ReactNode;
  /** Role or clinic subtitle on the third text line. */
  subtitleLine?: ReactNode;
};

/** Chairside wordmark for phone dashboard entry screens. */
export function DashboardBrandHeader({
  leading,
  trailing,
  nameLine,
  subtitleLine,
}: DashboardBrandHeaderProps) {
  const hasTextLines = Boolean(leading || nameLine || subtitleLine);

  const styles = useThemedStyles(({ spacing }) => {
    const stackGap = dashboardHeaderStackGap(spacing);

    return {
      container: {
        width: '100%',
        alignItems: 'center',
      },
      headerBlock: {
        width: '100%',
        gap: stackGap,
        paddingTop: stackGap,
      },
      wordmarkRow: {
        width: '100%',
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
      },
      wordmarkTrailing: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
      },
      textStack: {
        gap: stackGap,
      },
    };
  });

  if (!trailing && !hasTextLines) {
    return (
      <View style={styles.container}>
        <ChairsideWordmark variant="small" align="center" />
      </View>
    );
  }

  return (
    <View style={styles.headerBlock}>
      {trailing ? (
        <View style={styles.wordmarkRow}>
          <ChairsideWordmark variant="small" align="center" />
          <View style={styles.wordmarkTrailing}>{trailing}</View>
        </View>
      ) : (
        <View style={styles.container}>
          <ChairsideWordmark variant="small" align="center" />
        </View>
      )}

      {hasTextLines ? (
        <View style={styles.textStack}>
          {leading}
          {nameLine}
          {subtitleLine}
        </View>
      ) : null}
    </View>
  );
}
