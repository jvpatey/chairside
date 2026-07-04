import { Animated, Text, View } from 'react-native';

import { ChairsideWordmark } from '@/components/brand/ChairsideWordmark';
import { DetailHeroSkeleton } from '@/components/ui/skeletons/DetailHeroSkeleton';
import { ListCardSkeleton } from '@/components/ui/skeletons/ListCardSkeleton';
import { useEnterAnimation, usePulseOpacity } from '@/lib/motion';
import { useThemedStyles } from '@/theme';

type PageLoadingSpinnerProps = {
  message?: string;
};

type PageLoadingListProps = {
  message?: string;
  rowCount?: number;
  rowHeight?: number;
  compact?: boolean;
};

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

/** Full-screen branded loader for route gates and auth transitions. */
export function PageLoadingSpinner({ message }: PageLoadingSpinnerProps) {
  const pulse = usePulseOpacity();
  const { opacity, translateY } = useEnterAnimation();

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.backgroundGrouped,
      gap: spacing.lg,
    },
    wordmarkWrap: {
      alignItems: 'center',
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
      <Animated.View style={[styles.wordmarkWrap, { opacity: pulse }]}>
        <ChairsideWordmark variant="hero" />
      </Animated.View>
      <LoadingDots pulse={pulse} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </Animated.View>
  );
}

/** Inline list loading placeholder for tab screens. */
export function PageLoadingList({
  message = 'Loading…',
  rowCount = 4,
  rowHeight = 132,
  compact = false,
}: PageLoadingListProps) {
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={message}>
      <ListCardSkeleton rowCount={rowCount} rowHeight={rowHeight} compact={compact} />
    </View>
  );
}

/** Detail/form loading body for stack screens inside OnboardingShell. */
export function PageLoadingDetail() {
  return <DetailHeroSkeleton />;
}
