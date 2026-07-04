import { View } from 'react-native';

import { ShimmerBlock } from '@/components/dashboard/ShimmerBlock';
import { useThemedStyles } from '@/theme';

type MessagingInboxSkeletonProps = {
  compact?: boolean;
  rowCount?: number;
};

export function MessagingInboxSkeleton({
  compact = false,
  rowCount = compact ? 5 : 4,
}: MessagingInboxSkeletonProps) {
  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    container: {
      gap: spacing.sm,
    },
    chipRow: {
      flexDirection: 'row',
      gap: spacing.xs,
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
    lines: {
      flex: 1,
      gap: spacing.xs,
    },
  }));

  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel="Loading conversations">
      {!compact ? (
        <>
          <ShimmerBlock height={44} width="100%" borderRadius={12} />
          <View style={styles.chipRow}>
            {[0, 1, 2, 3].map((index) => (
              <ShimmerBlock key={index} height={32} width={72} borderRadius={16} />
            ))}
          </View>
        </>
      ) : null}
      <View style={styles.card}>
        {Array.from({ length: rowCount }, (_, index) => (
          <View key={index} style={[styles.row, index === rowCount - 1 ? { borderBottomWidth: 0 } : null]}>
            <ShimmerBlock height={compact ? 44 : 48} width={compact ? 44 : 48} borderRadius={compact ? 22 : 24} />
            <View style={styles.lines}>
              <ShimmerBlock height={12} width="34%" borderRadius={6} />
              <ShimmerBlock height={16} width="78%" borderRadius={6} />
              <ShimmerBlock height={12} width="56%" borderRadius={6} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export function MessagingThreadSkeleton() {
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
    },
    bubbleOther: {
      alignSelf: 'flex-start',
      width: '54%',
    },
    compose: {
      marginBottom: spacing.md,
    },
  }));

  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel="Loading messages">
      <View style={styles.header}>
        <ShimmerBlock height={40} width={40} borderRadius={20} />
        <View style={styles.headerLines}>
          <ShimmerBlock height={14} width="42%" borderRadius={6} />
          <ShimmerBlock height={12} width="68%" borderRadius={6} />
        </View>
      </View>
      <View style={styles.messages}>
        <ShimmerBlock height={52} width="54%" borderRadius={18} style={styles.bubbleOther} />
        <ShimmerBlock height={44} width="62%" borderRadius={18} style={styles.bubbleOwn} />
        <ShimmerBlock height={44} width="48%" borderRadius={18} style={styles.bubbleOwn} />
      </View>
      <ShimmerBlock height={52} width="100%" borderRadius={24} style={styles.compose} />
    </View>
  );
}
