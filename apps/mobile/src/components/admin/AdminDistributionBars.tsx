import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { fontBold, fontSemibold, useThemedStyles } from '@/theme';

type DistributionItem = {
  key: string;
  label: string;
  count: number;
  color: string;
};

type AdminDistributionBarsProps = {
  title: string;
  items: DistributionItem[];
  emptyLabel?: string;
  /** When false, hides the share percentage label. Defaults to true. */
  showPercent?: boolean;
  /** `plain` omits the outer card chrome (for embedding in another card). */
  variant?: 'card' | 'plain';
};

function DistributionBarRow({
  item,
  max,
  total,
  index,
  showPercent,
}: {
  item: DistributionItem;
  max: number;
  total: number;
  index: number;
  showPercent: boolean;
}) {
  const progress = useSharedValue(0);
  const pct = max > 0 ? item.count / max : 0;

  useEffect(() => {
    progress.value = withDelay(
      index * 40,
      withTiming(pct, { duration: 520, easing: Easing.out(Easing.cubic) }),
    );
  }, [index, pct, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(progress.value * 100, 0)}%`,
  }));

  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    row: {
      gap: 6,
    },
    meta: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    label: {
      flex: 1,
      fontFamily: fontSemibold,
      fontSize: 13,
      color: colors.labelPrimary,
    },
    count: {
      fontFamily: fontBold,
      fontSize: 13,
      color: colors.labelPrimary,
    },
    pct: {
      fontFamily: fontSemibold,
      fontSize: 12,
      color: colors.labelTertiary,
      minWidth: 40,
      textAlign: 'right',
    },
    track: {
      height: 10,
      borderRadius: radii.pill,
      backgroundColor: colors.fillSubtle,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: radii.pill,
    },
  }));

  const sharePct = total > 0 ? Math.round((item.count / total) * 100) : 0;

  return (
    <View
      style={styles.row}
      accessibilityLabel={
        showPercent
          ? `${item.label}: ${item.count}, ${sharePct} percent`
          : `${item.label}: ${item.count}`
      }>
      <View style={styles.meta}>
        <Text style={styles.label} numberOfLines={1}>
          {item.label}
        </Text>
        <Text style={styles.count}>{item.count.toLocaleString()}</Text>
        {showPercent ? <Text style={styles.pct}>{sharePct}%</Text> : null}
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { backgroundColor: item.color }, fillStyle]} />
      </View>
    </View>
  );
}

export function AdminDistributionBars({
  title,
  items,
  emptyLabel = 'No data yet',
  showPercent = true,
  variant = 'card',
}: AdminDistributionBarsProps) {
  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    card: {
      flex: 1,
      minWidth: variant === 'card' ? 280 : undefined,
      backgroundColor: variant === 'card' ? colors.surface : 'transparent',
      borderRadius: variant === 'card' ? radii.lg : 0,
      borderWidth: variant === 'card' ? StyleSheet.hairlineWidth : 0,
      borderColor: colors.separator,
      padding: variant === 'card' ? spacing.lg : 0,
      gap: spacing.md,
    },
    title: {
      fontFamily: fontBold,
      fontSize: 16,
      color: colors.labelPrimary,
    },
    list: {
      gap: spacing.md,
    },
    empty: {
      fontFamily: fontSemibold,
      fontSize: 13,
      color: colors.labelTertiary,
      paddingVertical: spacing.md,
    },
  }));

  const total = items.reduce((sum, item) => sum + item.count, 0);
  const maxCount = items.reduce((max, item) => Math.max(max, item.count), 0);

  return (
    <View style={styles.card}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {items.length === 0 ? (
        <Text style={styles.empty}>{emptyLabel}</Text>
      ) : (
        <View style={styles.list}>
          {items.map((item, index) => (
            <DistributionBarRow
              key={item.key}
              item={item}
              max={maxCount}
              total={total}
              index={index}
              showPercent={showPercent}
            />
          ))}
        </View>
      )}
    </View>
  );
}
