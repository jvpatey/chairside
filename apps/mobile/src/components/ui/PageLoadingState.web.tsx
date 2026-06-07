import { Animated, Text, View } from 'react-native';

import { useFadeIn, usePulseOpacity, useSpin } from '@/lib/webMotion.web';
import { useThemedStyles } from '@/theme';

type PageLoadingSpinnerProps = {
  message?: string;
};

type PageLoadingListProps = {
  message?: string;
  rowCount?: number;
};

function SkeletonBlock({
  height,
  width,
  borderRadius = 8,
  pulse,
}: {
  height: number;
  width: number | `${number}%`;
  borderRadius?: number;
  pulse: Animated.Value;
}) {
  const styles = useThemedStyles(({ colors }) => ({
    block: {
      height,
      width,
      borderRadius,
      backgroundColor: colors.fillSubtle,
    },
  }));

  return <Animated.View style={[styles.block, { opacity: pulse }]} />;
}

function LoadingDots({ pulse }: { pulse: Animated.Value }) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
  }));

  return (
    <View style={styles.row}>
      {[0, 1, 2].map((index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              opacity: pulse.interpolate({
                inputRange: [0.45, 1],
                outputRange: [0.35 + index * 0.15, 1 - index * 0.1],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
}

/** Full-screen centered spinner for route gates and auth transitions. */
export function PageLoadingSpinner({ message }: PageLoadingSpinnerProps) {
  const pulse = usePulseOpacity();
  const spin = useSpin();
  const { opacity, translateY } = useFadeIn();

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      gap: spacing.md,
    },
    ring: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 3,
      borderColor: colors.primarySubtle,
      borderTopColor: colors.primary,
    },
    message: {
      ...typography.subtitle,
      textAlign: 'center',
    },
  }));

  return (
    <Animated.View
      style={[styles.container, { opacity, transform: [{ translateY }] }]}
      accessibilityRole="progressbar"
      accessibilityLabel={message ?? 'Loading'}
    >
      <Animated.View style={[styles.ring, { opacity: pulse, transform: [{ rotate: spin }] }]} />
      <LoadingDots pulse={pulse} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </Animated.View>
  );
}

function SkeletonListRow({ pulse, isLast }: { pulse: Animated.Value; isLast?: boolean }) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderBottomWidth: isLast ? 0 : 1,
      borderBottomColor: colors.separator,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.fillSubtle,
    },
    lines: {
      flex: 1,
      gap: spacing.sm,
      paddingTop: 2,
    },
  }));

  return (
    <View style={styles.row}>
      <Animated.View style={[styles.avatar, { opacity: pulse }]} />
      <View style={styles.lines}>
        <SkeletonBlock pulse={pulse} height={12} width="38%" borderRadius={6} />
        <SkeletonBlock pulse={pulse} height={16} width="72%" borderRadius={6} />
        <SkeletonBlock pulse={pulse} height={12} width="54%" borderRadius={6} />
      </View>
    </View>
  );
}

/** Inline list loading placeholder for tab screens. */
export function PageLoadingList({ message = 'Loading…', rowCount = 4 }: PageLoadingListProps) {
  const pulse = usePulseOpacity();

  const styles = useThemedStyles(({ colors, isDark }) => ({
    container: {
      gap: 0,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      overflow: 'hidden',
      ...(isDark
        ? {}
        : ({
            // @ts-expect-error — boxShadow is web-only
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
          } as const)),
    },
  }));

  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityLabel={message}
    >
      <View style={styles.card}>
        {Array.from({ length: rowCount }, (_, index) => (
          <SkeletonListRow key={index} pulse={pulse} isLast={index === rowCount - 1} />
        ))}
      </View>
    </View>
  );
}

/** Detail/form loading body for stack screens inside OnboardingShell. */
export function PageLoadingDetail() {
  const pulse = usePulseOpacity();

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    container: {
      gap: spacing.lg,
      paddingTop: spacing.sm,
    },
    heroCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      ...(isDark
        ? {}
        : ({
            // @ts-expect-error — boxShadow is web-only
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
          } as const)),
    },
    heroAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.fillSubtle,
    },
    heroLines: {
      flex: 1,
      gap: spacing.sm,
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      gap: spacing.sm,
      ...(isDark
        ? {}
        : ({
            // @ts-expect-error — boxShadow is web-only
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
          } as const)),
    },
  }));

  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
    >
      <View style={styles.heroCard}>
        <Animated.View style={[styles.heroAvatar, { opacity: pulse }]} />
        <View style={styles.heroLines}>
          <SkeletonBlock pulse={pulse} height={14} width="46%" borderRadius={6} />
          <SkeletonBlock pulse={pulse} height={18} width="78%" borderRadius={6} />
          <SkeletonBlock pulse={pulse} height={12} width="58%" borderRadius={6} />
        </View>
      </View>
      <View style={styles.section}>
        <SkeletonBlock pulse={pulse} height={12} width="34%" borderRadius={6} />
        <SkeletonBlock pulse={pulse} height={14} width="92%" borderRadius={6} />
        <SkeletonBlock pulse={pulse} height={14} width="86%" borderRadius={6} />
        <SkeletonBlock pulse={pulse} height={14} width="64%" borderRadius={6} />
      </View>
      <View style={styles.section}>
        <SkeletonBlock pulse={pulse} height={12} width="28%" borderRadius={6} />
        <SkeletonBlock pulse={pulse} height={44} width="100%" borderRadius={12} />
      </View>
    </View>
  );
}
