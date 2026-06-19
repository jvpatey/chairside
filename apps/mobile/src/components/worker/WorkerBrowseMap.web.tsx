import { Text, View } from 'react-native';

import { WorkerMapUnavailable } from '@/components/worker/WorkerMapUnavailable';
import type { WorkerBrowseMapProps } from '@/components/worker/workerBrowseMapTypes';
import { useThemedStyles } from '@/theme';

export function WorkerBrowseMap({
  groups,
  unmappableCount,
}: WorkerBrowseMapProps) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      flex: 1,
      minHeight: 360,
      gap: spacing.md,
    },
    notice: {
      backgroundColor: colors.fillSubtle,
      borderRadius: 12,
      padding: spacing.md,
      gap: spacing.xs,
    },
    noticeTitle: {
      ...typography.subtitle,
      fontSize: 14,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    noticeBody: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
  }));

  return (
    <View style={styles.wrap}>
      {unmappableCount > 0 ? (
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>
            {unmappableCount} posting{unmappableCount === 1 ? '' : 's'} hidden from map
          </Text>
          <Text style={styles.noticeBody}>
            Some clinics are missing coordinates. Switch to list view to see every matching
            posting.
          </Text>
        </View>
      ) : null}
      <WorkerMapUnavailable
        title="Map not supported on web"
        body={
          groups.length === 0
            ? 'No clinics with map coordinates match your current filters. Switch to list view to browse postings.'
            : 'Open the iOS or Android app to explore nearby clinics on the map. List view works here.'
        }
      />
    </View>
  );
}
