import {
  deleteJobPost,
  getJobPostApplicationCount,
  updateJobPostStatus,
  type JobPost,
  type JobPostStatus,
} from '@chairside/api';
import { Alert, type StyleProp, type ViewStyle } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';

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
    case 'filled':
    case 'closed':
      return [
        { label: 'Publish again', status: 'live' },
        { label: 'Delete', isDelete: true, destructive: true },
      ];
    default:
      return [{ label: 'Delete', isDelete: true, destructive: true }];
  }
}

type JobPostManageMenuProps = {
  clinicId: string;
  job: JobPost;
  onUpdated: (job: JobPost) => void;
  onDeleted: () => void;
  style?: StyleProp<ViewStyle>;
};

export function JobPostManageMenu({
  clinicId,
  job,
  onUpdated,
  onDeleted,
  style,
}: JobPostManageMenuProps) {
  const handleStatusChange = async (status: JobPostStatus) => {
    try {
      const updated = await updateJobPostStatus(clinicId, job.id, status);
      onUpdated(updated);
    } catch (error) {
      Alert.alert(
        'Update failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  const confirmDelete = async () => {
    try {
      const applicationCount = await getJobPostApplicationCount(clinicId, job.id);
      const applicationWarning =
        applicationCount > 0
          ? ` This will permanently delete the posting and ${applicationCount} application${applicationCount === 1 ? '' : 's'}.`
          : ' This posting will be permanently deleted.';

      Alert.alert(
        'Delete posting?',
        `Are you sure you want to delete "${job.title}"?${applicationWarning}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              void (async () => {
                try {
                  await deleteJobPost(clinicId, job.id);
                  onDeleted();
                } catch (error) {
                  Alert.alert(
                    'Delete failed',
                    error instanceof Error ? error.message : 'Please try again.',
                  );
                }
              })();
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        'Delete failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  const showManageMenu = () => {
    const actions = getManageActions(job.status);

    Alert.alert('Manage posting', 'Choose an action for this role.', [
      ...actions.map((action) => ({
        text: action.label,
        style: action.destructive ? ('destructive' as const) : undefined,
        onPress: () => {
          if (action.isDelete) {
            void confirmDelete();
            return;
          }
          if (action.status) {
            void handleStatusChange(action.status);
          }
        },
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  return (
    <OnboardingButton
      label="Manage"
      variant="secondary"
      onPress={showManageMenu}
      style={style}
    />
  );
}
