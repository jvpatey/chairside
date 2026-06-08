import {
  deleteJobPost,
  getJobPostApplicationCount,
  updateJobPostStatus,
  type JobPost,
  type JobPostStatus,
} from '@chairside/api';
import { useCallback } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { showConfirmActionSheet } from '@/lib/confirmActionSheet';
import {
  webHover,
  webListRowHoverStyles,
  webPointer,
  webPillButtonHoverStyles,
} from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

type ManageAction = {
  label: string;
  status?: JobPostStatus;
  destructive?: boolean;
  isDelete?: boolean;
};

function getManageActions(status: JobPostStatus): ManageAction[] {
  switch (status) {
    case 'live':
      return [
        { label: 'Pause posting', status: 'paused' },
        { label: 'Mark as filled', status: 'filled' },
        { label: 'Archive', status: 'closed' },
        { label: 'Delete', isDelete: true, destructive: true },
      ];
    case 'paused':
      return [
        { label: 'Publish', status: 'live' },
        { label: 'Archive', status: 'closed' },
        { label: 'Delete', isDelete: true, destructive: true },
      ];
    case 'closed':
      return [
        { label: 'Post again', status: 'live' },
        { label: 'Delete', isDelete: true, destructive: true },
      ];
    case 'filled':
      return [
        { label: 'Delete', isDelete: true, destructive: true },
        { label: 'Post again', status: 'live' },
      ];
    default:
      return [{ label: 'Delete', isDelete: true, destructive: true }];
  }
}

export type JobPostManageSheetProps = {
  visible: boolean;
  clinicId: string;
  job: JobPost;
  onUpdated: (job: JobPost) => void;
  onDeleted: () => void;
  onClose: () => void;
};

export function JobPostManageSheet({
  visible,
  clinicId,
  job,
  onUpdated,
  onDeleted,
  onClose,
}: JobPostManageSheetProps) {
  const insets = useSafeAreaInsets();
  const actions = getManageActions(job.status);

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
      paddingTop: spacing.md,
      paddingBottom: Math.max(insets.bottom, spacing.lg),
    },
    handle: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: 999,
      backgroundColor: colors.separator,
      marginBottom: spacing.md,
    },
    header: {
      marginBottom: spacing.md,
      paddingBottom: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.separator,
    },
    title: {
      fontSize: 17,
      fontWeight: '600',
      lineHeight: 24,
      color: colors.labelPrimary,
    },
    actions: {
      gap: 0,
    },
    action: {
      paddingVertical: spacing.md,
      borderRadius: 10,
      ...webPointer(),
    },
    actionHovered: webListRowHoverStyles(colors),
    actionPressed: {
      opacity: 0.88,
    },
    actionDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
    },
    actionLabel: {
      fontSize: 17,
      lineHeight: 24,
      textAlign: 'center',
      color: colors.labelPrimary,
    },
    actionDestructive: {
      color: colors.destructive,
    },
    cancel: {
      marginTop: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: 12,
      backgroundColor: colors.fillSubtle,
      ...webPointer(),
    },
    cancelHovered: webPillButtonHoverStyles(colors),
    cancelPressed: {
      opacity: 0.88,
    },
    cancelLabel: {
      fontSize: 17,
      lineHeight: 24,
      fontWeight: '600',
      textAlign: 'center',
      color: colors.labelPrimary,
    },
  }));

  const handleStatusChange = useCallback(
    async (status: JobPostStatus) => {
      try {
        const updated = await updateJobPostStatus(clinicId, job.id, status);
        onUpdated(updated);
      } catch (error) {
        Alert.alert(
          'Update failed',
          error instanceof Error ? error.message : 'Please try again.',
        );
      }
    },
    [clinicId, job.id, onUpdated],
  );

  const confirmDelete = useCallback(async () => {
    try {
      const applicationCount = await getJobPostApplicationCount(clinicId, job.id);
      const applicationWarning =
        applicationCount > 0
          ? ` This will permanently delete the posting and ${applicationCount} application${applicationCount === 1 ? '' : 's'}.`
          : ' This posting will be permanently deleted.';

      showConfirmActionSheet({
        title: 'Delete posting?',
        message: `Are you sure you want to delete "${job.title}"?${applicationWarning}`,
        confirmLabel: 'Delete',
        destructive: true,
        onConfirm: async () => {
          try {
            await deleteJobPost(clinicId, job.id);
            onDeleted();
          } catch (error) {
            Alert.alert(
              'Delete failed',
              error instanceof Error ? error.message : 'Please try again.',
            );
          }
        },
      });
    } catch (error) {
      Alert.alert(
        'Delete failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  }, [clinicId, job.id, job.title, onDeleted]);

  const runAction = useCallback(
    (action: ManageAction) => {
      onClose();
      if (action.isDelete) {
        void confirmDelete();
        return;
      }
      if (action.status === 'live' && (job.status === 'closed' || job.status === 'filled')) {
        showConfirmActionSheet({
          title: 'Post again?',
          message: `"${job.title}" will go live and appear to candidates again. Applications stay linked to this posting.`,
          confirmLabel: 'Post again',
          onConfirm: () => {
            void handleStatusChange('live');
          },
        });
        return;
      }
      if (action.status) {
        void handleStatusChange(action.status);
      }
    },
    [confirmDelete, handleStatusChange, job.status, job.title, onClose],
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close manage menu"
        />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Manage posting</Text>
          </View>
          <View style={styles.actions}>
            {actions.map((action, index) => (
              <Pressable
                key={action.label}
                accessibilityRole="button"
                onPress={() => runAction(action)}
                style={({ pressed, hovered }) => [
                  styles.action,
                  index > 0 && styles.actionDivider,
                  webHover(hovered, pressed, styles.actionHovered),
                  pressed && styles.actionPressed,
                ]}
              >
                <Text
                  style={[
                    styles.actionLabel,
                    action.destructive && styles.actionDestructive,
                  ]}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            onPress={onClose}
            style={({ pressed, hovered }) => [
              styles.cancel,
              webHover(hovered, pressed, styles.cancelHovered),
              pressed && styles.cancelPressed,
            ]}
          >
            <Text style={styles.cancelLabel}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
