import {
  deleteShiftPost,
  getShiftPostApplicationCount,
  updateShiftPostStatus,
  type ShiftPost,
  type ShiftPostStatus,
} from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { ActionMenuSheet } from '@/components/ui/ActionMenuSheet';
import { showConfirmActionSheet } from '@/lib/confirmActionSheet';
import { formatShiftPostRoleTitle } from '@/lib/shiftPostDisplay';
import { useTheme, useThemedStyles } from '@/theme';

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
  trigger?: 'button' | 'icon';
};

export function ShiftPostManageMenu({
  clinicId,
  shift,
  onUpdated,
  onDeleted,
  style,
  trigger = 'button',
}: ShiftPostManageMenuProps) {
  const { colors } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
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

      showConfirmActionSheet({
        title: 'Delete fill-in?',
        message: `Are you sure you want to delete "${shiftLabel}"?${applicationWarning}`,
        confirmLabel: 'Delete',
        destructive: true,
        onConfirm: async () => {
          try {
            await deleteShiftPost(clinicId, shift.id);
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
  };

  const runAction = (action: ManageAction) => {
    if (action.isDelete) {
      void confirmDelete();
      return;
    }
    if (action.status) {
      void handleStatusChange(action.status);
    }
  };

  const menuActions = getManageActions(shift.status).map((action) => ({
    label: action.label,
    destructive: action.destructive,
    onPress: () => runAction(action),
  }));

  const iconStyles = useThemedStyles(({ colors }) => ({
    iconButton: {
      width: 50,
      height: 50,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    iconButtonPressed: {
      backgroundColor: colors.backgroundGrouped,
      opacity: 0.9,
    },
  }));

  const openMenu = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMenuVisible(true);
  };

  const triggerControl =
    trigger === 'icon' ? (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Manage fill-in"
        onPress={openMenu}
        style={({ pressed }) => [
          iconStyles.iconButton,
          pressed && iconStyles.iconButtonPressed,
          style,
        ]}>
        <Ionicons name="ellipsis-horizontal" size={22} color={colors.labelPrimary} />
      </Pressable>
    ) : (
      <OnboardingButton label="Manage" variant="secondary" onPress={openMenu} style={style} />
    );

  return (
    <>
      {triggerControl}
      <ActionMenuSheet
        visible={menuVisible}
        title="Manage fill-in"
        message="Choose an action for this shift."
        actions={menuActions}
        onClose={() => setMenuVisible(false)}
      />
    </>
  );
}
