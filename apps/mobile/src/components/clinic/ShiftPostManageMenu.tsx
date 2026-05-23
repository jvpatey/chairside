import {
  deleteShiftPost,
  getShiftPostApplicationCount,
  updateShiftPostStatus,
  type ShiftPost,
  type ShiftPostStatus,
} from '@chairside/api';
import { Alert, type StyleProp, type ViewStyle } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { formatShiftPostRoleTitle } from '@/lib/shiftPostDisplay';

type ManageAction = {
  label: string;
  status?: ShiftPostStatus;
  destructive?: boolean;
  isDelete?: boolean;
};

function getManageActions(status: ShiftPostStatus): ManageAction[] {
  switch (status) {
    case 'live':
      return [
        { label: 'Mark as filled', status: 'filled' },
        { label: 'Close shift', status: 'closed' },
        { label: 'Delete', isDelete: true, destructive: true },
      ];
    case 'filled':
      return [
        { label: 'Reopen shift', status: 'live' },
        { label: 'Close shift', status: 'closed' },
        { label: 'Delete', isDelete: true, destructive: true },
      ];
    case 'closed':
      return [
        { label: 'Reopen shift', status: 'live' },
        { label: 'Delete', isDelete: true, destructive: true },
      ];
    case 'draft':
      return [
        { label: 'Publish shift', status: 'live' },
        { label: 'Delete', isDelete: true, destructive: true },
      ];
    default:
      return [{ label: 'Delete', isDelete: true, destructive: true }];
  }
}

type ShiftPostManageMenuProps = {
  clinicId: string;
  shift: ShiftPost;
  onUpdated: (shift: ShiftPost) => void;
  onDeleted: () => void;
  style?: StyleProp<ViewStyle>;
};

export function ShiftPostManageMenu({
  clinicId,
  shift,
  onUpdated,
  onDeleted,
  style,
}: ShiftPostManageMenuProps) {
  const shiftLabel = formatShiftPostRoleTitle(shift.role_type);

  const handleStatusChange = async (status: ShiftPostStatus) => {
    try {
      const updated = await updateShiftPostStatus(clinicId, shift.id, status);
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
      const applicationCount = await getShiftPostApplicationCount(clinicId, shift.id);
      const applicationWarning =
        applicationCount > 0
          ? ` This will permanently delete the fill-in and ${applicationCount} application${applicationCount === 1 ? '' : 's'}.`
          : ' This fill-in will be permanently deleted.';

      Alert.alert(
        'Delete fill-in?',
        `Are you sure you want to delete "${shiftLabel}"?${applicationWarning}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              void (async () => {
                try {
                  await deleteShiftPost(clinicId, shift.id);
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
    const actions = getManageActions(shift.status);

    Alert.alert('Manage fill-in', 'Choose an action for this shift.', [
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
