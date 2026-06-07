import { ActivityIndicator, Text, View } from 'react-native';

import { useTheme, useThemedStyles } from '@/theme';

type PageLoadingSpinnerProps = {
  message?: string;
};

type PageLoadingListProps = {
  message?: string;
  rowCount?: number;
};

/** Full-screen centered spinner for route gates and auth transitions. */
export function PageLoadingSpinner({ message }: PageLoadingSpinnerProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      gap: spacing.md,
    },
    message: typography.subtitle,
  }));

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} size="large" />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

/** Inline list loading placeholder for tab screens. */
export function PageLoadingList({ message = 'Loading…', rowCount: _rowCount = 4 }: PageLoadingListProps) {
  const styles = useThemedStyles(({ typography }) => ({
    message: typography.subtitle,
  }));

  return <Text style={styles.message}>{message}</Text>;
}

/** Detail/form loading body for stack screens inside OnboardingShell. */
export function PageLoadingDetail() {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ spacing }) => ({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: spacing.xl,
    },
  }));

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} size="small" />
    </View>
  );
}
