import type { Conversation } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { ActionMenuSheet } from '@/components/ui/ActionMenuSheet';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import { useWorkerPhotoUri } from '@/hooks/useWorkerPhotoUri';
import { formatConversationDisplay } from '@/lib/conversationDisplay';
import { getHideConversationMessage } from '@/lib/conversationHide';
import { formatNotificationTime } from '@/lib/notificationDisplay';
import {
  webHover,
  webIconButtonHoverStyles,
  webListRowHoverStyles,
  webListRowSelectedStyles,
  webPointer,
} from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type ConversationListItemProps = {
  conversation: Conversation;
  avatarKind: 'clinic' | 'worker';
  role: 'worker' | 'clinic';
  onPress: () => void;
  onDelete?: () => void;
  isLast?: boolean;
  /** Split-view selection (web/tablet). */
  selected?: boolean;
  /** Tighter row spacing for compact inbox panes. */
  compact?: boolean;
};

function ConversationAvatar({
  conversation,
  avatarKind,
  size,
}: {
  conversation: Conversation;
  avatarKind: 'clinic' | 'worker';
  size: number;
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
        size={size}
      />
    );
  }

  return (
    <WorkerProfileAvatar
      displayName={conversation.counterpart_name}
      photoUri={workerPhotoUri}
      size={size}
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
  selected = false,
  compact = false,
}: ConversationListItemProps) {
  const { colors } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [rowHovered, setRowHovered] = useState(false);
  const isWeb = Platform.OS === 'web';
  const timestamp = formatNotificationTime(conversation.last_message_at ?? undefined);
  const display = formatConversationDisplay(conversation, role);

  const avatarSize = compact ? 36 : 40;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      paddingVertical: compact ? spacing.sm + 2 : spacing.md,
      paddingHorizontal: compact ? spacing.sm : spacing.md,
      position: 'relative' as const,
    },
    rowHovered: webListRowHoverStyles(colors),
    rowSelected: webListRowSelectedStyles(colors),
    selectedAccent: {
      position: 'absolute' as const,
      left: 0,
      top: spacing.xs,
      bottom: spacing.xs,
      width: 3,
      borderRadius: 2,
      backgroundColor: colors.primary,
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
      ...webPointer(),
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
      ...webPointer(),
    },
    menuButtonHovered: webIconButtonHoverStyles(colors),
    menuButtonPressed: {
      opacity: 0.75,
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

  const accessibilityLabel = [
    display.cardName,
    display.cardMeta,
    conversation.unread ? 'Unread' : null,
    conversation.last_message_preview,
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <>
      <View
        style={[
          styles.row,
          !isLast && styles.rowSeparator,
          selected && styles.rowSelected,
          isWeb && rowHovered && !selected && styles.rowHovered,
        ]}
        {...(isWeb
          ? {
              onMouseEnter: () => setRowHovered(true),
              onMouseLeave: () => setRowHovered(false),
            }
          : {})}>
        {selected ? <View style={styles.selectedAccent} /> : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityState={{ selected }}
          onPress={onPress}
          style={({ pressed }) => [styles.mainPressable, pressed && styles.mainPressed]}>
          <ConversationAvatar conversation={conversation} avatarKind={avatarKind} size={avatarSize} />
          <View style={styles.textWrap}>
            <View style={styles.titleRow}>
              <Text style={styles.roleEyebrow} numberOfLines={1}>
                {display.cardTitle}
              </Text>
              {timestamp ? <Text style={styles.timestamp}>{timestamp}</Text> : null}
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {display.cardName}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {display.cardMeta}
            </Text>
            <View style={styles.titleRow}>
              <Text style={styles.preview} numberOfLines={1}>
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
              onPress={(event) => {
                event.stopPropagation?.();
                openMenu();
              }}
              style={({ pressed, hovered }) => [
                styles.menuButton,
                webHover(hovered, pressed, styles.menuButtonHovered),
                pressed && styles.menuButtonPressed,
              ]}>
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
