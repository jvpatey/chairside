import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { PillBadge } from '@/components/ui/PillBadge';
import { WorkerMapPostCard } from '@/components/worker/WorkerMapPostCard';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { dashboardSectionGap } from '@/components/dashboard/dashboardLayout';
import type { WorkerMapClinicGroup } from '@/lib/workerMapItems';
import {
  adaptiveSheetHeader,
  adaptiveSheetRoot,
  adaptiveSheetScroll,
  adaptiveSheetScrollContent,
} from '@/lib/adaptiveSheetBodyStyles';
import { webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

export type WorkerMapClinicSheetProps = {
  visible: boolean;
  group: WorkerMapClinicGroup | null;
  onClose: () => void;
  onSelectItem: (item: WorkerMapClinicGroup['items'][number]) => void;
  variant?: 'sheet' | 'dialog';
};

function formatLocationLabel(group: WorkerMapClinicGroup): string {
  const cityProvince = [group.city, group.province].filter(Boolean).join(', ');
  if (cityProvince && group.distanceLabel) {
    return `${cityProvince} • ${group.distanceLabel}`;
  }
  return cityProvince || group.distanceLabel || '';
}

export function WorkerMapClinicSheetBody({
  group,
  onClose,
  onSelectItem,
  variant = 'sheet',
}: WorkerMapClinicSheetProps) {
  const { colors } = useTheme();
  const isDialog = variant === 'dialog';

  const styles = useThemedStyles(({ colors, spacing }) => ({
    root: {
      gap: spacing.sm,
      ...adaptiveSheetRoot(isDialog),
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.sm,
      marginBottom: isDialog ? 0 : spacing.sm,
      paddingBottom: spacing.md,
      ...adaptiveSheetHeader(isDialog, colors),
    },
    headerContent: {
      flex: 1,
      minWidth: 0,
    },
    summaryRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginTop: spacing.sm,
    },
    scroll: {
      marginHorizontal: isDialog ? 0 : -spacing.md,
      ...adaptiveSheetScroll(isDialog, 560),
    },
    list: adaptiveSheetScrollContent(isDialog, {
      gap: dashboardSectionGap(spacing),
      paddingHorizontal: isDialog ? 0 : spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    }),
    closeButton: {
      padding: spacing.xs,
      marginTop: spacing.xs,
      ...webPointer(),
    },
  }));

  if (!group) return null;

  const location = formatLocationLabel(group);
  const summaryLabel = [
    group.jobCount > 0 ? `${group.jobCount} role${group.jobCount === 1 ? '' : 's'}` : null,
    group.shiftCount > 0 ? `${group.shiftCount} fill-in${group.shiftCount === 1 ? '' : 's'}` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <View style={styles.headerContent}>
          <ClinicPostHeader
            layout="stacked"
            clinicName={group.clinicName}
            logoStoragePath={group.logoStoragePath}
            location={location || null}
            detail={summaryLabel || null}
            avatarSize={48}
          />
          {group.hasSaved || group.hasApplied ? (
            <View style={styles.summaryRow}>
              {group.hasSaved ? (
                <PillBadge
                  label="Saved"
                  color={colors.labelSecondary}
                  backgroundColor={colors.fillSubtle}
                />
              ) : null}
              {group.hasApplied ? (
                <PillBadge
                  label="Applied"
                  color={colors.primary}
                  backgroundColor={colors.primarySubtle}
                />
              ) : null}
            </View>
          ) : null}
        </View>
        {!isDialog ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close clinic details"
            onPress={onClose}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={22} color={colors.labelSecondary} />
          </Pressable>
        ) : null}
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
        {group.items.map((item) => (
          <WorkerMapPostCard
            key={`${item.kind}-${item.id}`}
            item={item}
            onPress={() => onSelectItem(item)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
