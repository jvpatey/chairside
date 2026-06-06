import type { Conversation } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { ActionMenuSheet } from '@/components/ui/ActionMenuSheet';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import { useWorkerPhotoUri } from '@/hooks/useWorkerPhotoUri';
import { formatConversationDisplay } from '@/lib/conversationDisplay';
import { getHideConversationMessage } from '@/lib/conversationHide';
import { formatNotificationTime } from '@/lib/notificationDisplay';
import { useTheme, useThemedStyles } from '@/theme';

type ConversationListItemProps = {
  conversation: Conversation;
  avatarKind: 'clinic' | 'worker';
  role: 'worker' | 'clinic';
  onPress: () => void;
  onDelete?: () => void;
  isLast?: boolean;
};

function ConversationAvatar({
  conversation,
  avatarKind,
}: {
  conversation: Conversation;
  avatarKind: 'clinic' | 'worker';
}) {
  const clinicLogoUri = useClinicLogoUri(
    avatarKind === 'clinic' ? conversation.counterpart_logo_storage_path : null,
  );
  const workerPhotoUri = useWorkerPhotoUri(
    avatarKind === 'worker' ? conversation.counterpart_logo_storage_path : null,
  );

  if (avatarKind === 'clinic') {
    return (
      <ClinicLogoAvatar
        clinicName={conversation.counterpart_name}
        logoUri={clinicLogoUri}
        size={40}
      />
    );
  }

  return (
    <WorkerProfileAvatar
      displayName={conversation.counterpart_name}
      photoUri={workerPhotoUri}
      size={40}
    />
  );
}

export function ConversationListItem({
  conversation,
  avatarKind,
  role,
  onPress,
  onDelete,
  isLast = false,
}: ConversationListItemProps) {
  const { colors } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const timestamp = formatNotificationTime(conversation.last_message_at ?? undefined);
  const display = formatConversationDisplay(conversation, role);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
    },
    rowSeparator: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.separator,
    },
    mainPressable: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      minWidth: 0,
    },
    mainPressed: {
      opacity: 0.92,
    },
    textWrap: { flex: 1, gap: 2, minWidth: 0 },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    roleEyebrow: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.labelSecondary,
      flex: 1,
    },
    name: {
      ...typography.body,
      fontSize: 16,
      lineHeight: 21,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    meta: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
    preview: {
      fontSize: 13,
      lineHeight: 18,
      color: conversation.unread ? colors.labelPrimary : colors.labelSecondary,
      fontWeight: conversation.unread ? '600' : '400',
    },
    timestamp: {
      fontSize: 12,
      color: colors.labelTertiary,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    menuButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    menuButtonPressed: {
      backgroundColor: colors.fillSubtle,
    },
    trailing: {
      alignSelf: 'stretch',
      justifyContent: 'center',
      paddingTop: 2,
    },
  }));

  const openMenu = () => {
    if (!onDelete) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMenuVisible(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      await onDelete?.();
    } catch (error) {
      Alert.alert(
        'Could not delete',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  return (
    <>
      <View style={[styles.row, !isLast && styles.rowSeparator]}>
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={({ pressed }) => [styles.mainPressable, pressed && styles.mainPressed]}>
          <ConversationAvatar conversation={conversation} avatarKind={avatarKind} />
          <View style={styles.textWrap}>
            <View style={styles.titleRow}>
              <Text style={styles.roleEyebrow} numberOfLines={1}>
                {display.cardTitle}
              </Text>
              {timestamp ? <Text style={styles.timestamp}>{timestamp}</Text> : null}
            </View>
            <Text style={styles.name} numberOfLines={2}>
              {display.cardName}
            </Text>
            <Text style={styles.meta} numberOfLines={2}>
              {display.cardMeta}
            </Text>
            <View style={styles.titleRow}>
              <Text style={styles.preview} numberOfLines={2}>
                {conversation.last_message_preview ?? 'No messages yet'}
              </Text>
              {conversation.unread ? <View style={styles.unreadDot} /> : null}
            </View>
          </View>
        </Pressable>
        <View style={styles.trailing}>
          {onDelete ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Conversation options"
              hitSlop={8}
              onPress={openMenu}
              style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}>
              <Ionicons name="ellipsis-horizontal" size={18} color={colors.labelTertiary} />
            </Pressable>
          ) : (
            <Ionicons name="chevron-forward" size={16} color={colors.labelTertiary} />
          )}
        </View>
      </View>

      <ActionMenuSheet
        visible={menuVisible}
        title={display.cardName}
        actions={[
          {
            label: 'Delete from inbox',
            destructive: true,
            onPress: () => setConfirmVisible(true),
          },
        ]}
        onClose={() => setMenuVisible(false)}
      />

      <ActionMenuSheet
        visible={confirmVisible}
        title="Delete conversation?"
        message={getHideConversationMessage(conversation)}
        actions={[
          {
            label: 'Delete',
            destructive: true,
            onPress: () => {
              void handleDeleteConfirmed();
            },
          },
        ]}
        onClose={() => setConfirmVisible(false)}
      />
    </>
  );
}
