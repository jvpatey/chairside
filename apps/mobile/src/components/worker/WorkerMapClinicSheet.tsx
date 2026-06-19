import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PillBadge } from '@/components/ui/PillBadge';
import { WorkerMapPostCard } from '@/components/worker/WorkerMapPostCard';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { dashboardSectionGap } from '@/components/dashboard/dashboardLayout';
import type { WorkerMapClinicGroup } from '@/lib/workerMapItems';
import { webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type WorkerMapClinicSheetProps = {
  visible: boolean;
  group: WorkerMapClinicGroup | null;
  onClose: () => void;
  onSelectItem: (item: WorkerMapClinicGroup['items'][number]) => void;
};

function formatLocationLabel(group: WorkerMapClinicGroup): string {
  const cityProvince = [group.city, group.province].filter(Boolean).join(', ');
  if (cityProvince && group.distanceLabel) {
    return `${cityProvince} • ${group.distanceLabel}`;
  }
  return cityProvince || group.distanceLabel || '';
}

export function WorkerMapClinicSheet({
  visible,
  group,
  onClose,
  onSelectItem,
}: WorkerMapClinicSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const styles = useThemedStyles(({ colors, spacing }) => ({
    root: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: Math.max(insets.bottom, spacing.lg),
      maxHeight: '78%',
    },
    handle: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: 999,
      backgroundColor: colors.separator,
      marginBottom: spacing.sm,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.sm,
      marginBottom: spacing.md,
      paddingBottom: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.separator,
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
    list: {
      gap: dashboardSectionGap(spacing),
      paddingBottom: spacing.xs,
    },
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable accessibilityRole="button" style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close clinic details"
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={22} color={colors.labelSecondary} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.list}>
            {group.items.map((item) => (
              <WorkerMapPostCard
                key={`${item.kind}-${item.id}`}
                item={item}
                onPress={() => onSelectItem(item)}
              />
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
