import { Animated, View } from 'react-native';

import { usePulseOpacity } from '@/lib/motion';
import { useThemedStyles } from '@/theme';

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

type MessagingInboxSkeletonProps = {
  compact?: boolean;
  rowCount?: number;
};

export function MessagingInboxSkeleton({
  compact = false,
  rowCount = compact ? 5 : 4,
}: MessagingInboxSkeletonProps) {
  const pulse = usePulseOpacity();

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    container: {
      gap: spacing.sm,
    },
    search: {
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.fillSubtle,
    },
    chipRow: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    chip: {
      height: 32,
      width: 72,
      borderRadius: 16,
      backgroundColor: colors.fillSubtle,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: compact ? 12 : 16,
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
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: compact ? spacing.sm + 2 : spacing.md,
      paddingHorizontal: compact ? spacing.sm : spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
    },
    avatar: {
      width: compact ? 44 : 48,
      height: compact ? 44 : 48,
      borderRadius: compact ? 22 : 24,
      backgroundColor: colors.fillSubtle,
    },
    lines: {
      flex: 1,
      gap: spacing.xs,
    },
  }));

  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel="Loading conversations">
      {!compact ? (
        <>
          <Animated.View style={[styles.search, { opacity: pulse }]} />
          <View style={styles.chipRow}>
            {[0, 1, 2, 3].map((index) => (
              <Animated.View key={index} style={[styles.chip, { opacity: pulse }]} />
            ))}
          </View>
        </>
      ) : null}
      <View style={styles.card}>
        {Array.from({ length: rowCount }, (_, index) => (
          <View key={index} style={[styles.row, index === rowCount - 1 ? { borderBottomWidth: 0 } : null]}>
            <Animated.View style={[styles.avatar, { opacity: pulse }]} />
            <View style={styles.lines}>
              <SkeletonBlock pulse={pulse} height={12} width="34%" borderRadius={6} />
              <SkeletonBlock pulse={pulse} height={16} width="78%" borderRadius={6} />
              <SkeletonBlock pulse={pulse} height={12} width="56%" borderRadius={6} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export function MessagingThreadSkeleton() {
  const pulse = usePulseOpacity();

  const styles = useThemedStyles(({ spacing, colors }) => ({
    container: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      gap: spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingBottom: spacing.sm,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.fillSubtle,
    },
    headerLines: {
      flex: 1,
      gap: spacing.xs,
    },
    messages: {
      flex: 1,
      justifyContent: 'flex-end',
      gap: spacing.sm,
      paddingBottom: spacing.xl,
    },
    bubbleOwn: {
      alignSelf: 'flex-end',
      width: '62%',
      height: 44,
      borderRadius: 18,
      backgroundColor: colors.fillSubtle,
    },
    bubbleOther: {
      alignSelf: 'flex-start',
      width: '54%',
      height: 52,
      borderRadius: 18,
      backgroundColor: colors.fillSubtle,
    },
    compose: {
      height: 52,
      borderRadius: 24,
      backgroundColor: colors.fillSubtle,
      marginBottom: spacing.md,
    },
  }));

  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel="Loading messages">
      <View style={styles.header}>
        <Animated.View style={[styles.avatar, { opacity: pulse }]} />
        <View style={styles.headerLines}>
          <SkeletonBlock pulse={pulse} height={14} width="42%" borderRadius={6} />
          <SkeletonBlock pulse={pulse} height={12} width="68%" borderRadius={6} />
        </View>
      </View>
      <View style={styles.messages}>
        <Animated.View style={[styles.bubbleOther, { opacity: pulse }]} />
        <Animated.View style={[styles.bubbleOwn, { opacity: pulse }]} />
        <Animated.View style={[styles.bubbleOwn, { opacity: pulse, width: '48%' }]} />
      </View>
      <Animated.View style={[styles.compose, { opacity: pulse }]} />
    </View>
  );
}
