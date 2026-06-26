import type { Conversation } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';

import { SearchMatchText } from '@/components/messaging/SearchMatchText';
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
  /** Split-view selection (web/tablet). */
  selected?: boolean;
  /** When searching messages, show the matching message snippet instead of last preview. */
  messageSearchPreview?: string | null;
  /** Active inbox search query — used to highlight matched text in previews and names. */
  searchQuery?: string;
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
  selected = false,
  compact = false,
  messageSearchPreview,
  searchQuery = '',
}: ConversationListItemProps) {
  const { colors } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [rowHovered, setRowHovered] = useState(false);
  const isWeb = Platform.OS === 'web';
  const timestamp = formatNotificationTime(conversation.last_message_at ?? undefined);
  const display = formatConversationDisplay(conversation, role);
  const activeSearchQuery = searchQuery.trim();
  const previewText =
    messageSearchPreview ?? conversation.last_message_preview ?? 'No messages yet';

  const avatarSize = compact ? 36 : 40;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'stretch',
      paddingVertical: compact ? spacing.sm + 2 : spacing.md,
      paddingHorizontal: compact ? spacing.sm : spacing.md,
      position: 'relative' as const,
      backgroundColor: conversation.unread ? colors.primarySubtle : 'transparent',
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
    mainPressable: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minWidth: 0,
      ...webPointer(),
    },
    mainPressed: {
      opacity: 0.92,
    },
    textWrap: { flex: 1, gap: 2, minWidth: 0, paddingRight: spacing.xs },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    titleRowWithMenu: {
      paddingRight: 36,
    },
    roleEyebrow: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.45,
      textTransform: 'uppercase',
      color: colors.labelSecondary,
      flex: 1,
    },
    name: {
      ...typography.body,
      fontSize: 17,
      lineHeight: 22,
      fontWeight: conversation.unread ? '700' : '600',
      letterSpacing: -0.2,
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
      color: activeSearchQuery
        ? colors.labelSecondary
        : conversation.unread
          ? colors.labelPrimary
          : colors.labelSecondary,
      fontWeight: activeSearchQuery ? '400' : conversation.unread ? '600' : '400',
      flex: 1,
    },
    previewHighlight: {
      fontWeight: '700',
      color: colors.labelPrimary,
    },
    previewRowExpanded: {
      alignItems: 'flex-start',
    },
    nameHighlight: {
      fontWeight: '800',
      color: colors.labelPrimary,
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
    unreadDotExpanded: {
      marginTop: 5,
    },
    menuButton: {
      position: 'absolute' as const,
      top: compact ? spacing.xs : spacing.sm,
      right: compact ? spacing.sm : spacing.md,
      zIndex: 2,
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      ...webPointer(),
    },
    menuButtonHovered: webIconButtonHoverStyles(colors),
    menuButtonPressed: {
      opacity: 0.75,
    },
    chevronWrap: {
      flexShrink: 0,
      alignSelf: 'center',
      marginLeft: spacing.xs,
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
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityState={{ selected }}
          onPress={onPress}
          style={({ pressed }) => [styles.mainPressable, pressed && styles.mainPressed]}>
          <ConversationAvatar conversation={conversation} avatarKind={avatarKind} size={avatarSize} />
          <View style={styles.textWrap}>
            <View style={[styles.titleRow, onDelete ? styles.titleRowWithMenu : null]}>
              <Text style={styles.roleEyebrow} numberOfLines={1}>
                {display.cardTitle}
              </Text>
              {timestamp ? <Text style={styles.timestamp}>{timestamp}</Text> : null}
            </View>
            {activeSearchQuery ? (
              <SearchMatchText
                text={display.cardName}
                query={activeSearchQuery}
                style={styles.name}
                highlightStyle={styles.nameHighlight}
                numberOfLines={1}
              />
            ) : (
              <Text style={styles.name} numberOfLines={1}>
                {display.cardName}
              </Text>
            )}
            {!compact ? (
              <Text style={styles.meta} numberOfLines={1}>
                {display.cardMeta}
              </Text>
            ) : null}
            <View style={[styles.titleRow, activeSearchQuery ? styles.previewRowExpanded : null]}>
              {activeSearchQuery && previewText !== 'No messages yet' ? (
                <SearchMatchText
                  text={previewText}
                  query={activeSearchQuery}
                  style={styles.preview}
                  highlightStyle={styles.previewHighlight}
                  numberOfLines={messageSearchPreview ? undefined : compact ? 3 : 2}
                />
              ) : (
                <Text style={styles.preview} numberOfLines={compact ? 2 : 1}>
                  {previewText}
                </Text>
              )}
              {conversation.unread ? (
                <View
                  style={[
                    styles.unreadDot,
                    activeSearchQuery ? styles.unreadDotExpanded : null,
                  ]}
                />
              ) : null}
            </View>
          </View>
          {!compact ? (
            <View style={styles.chevronWrap}>
              <Ionicons name="chevron-forward" size={16} color={colors.labelTertiary} />
            </View>
          ) : null}
        </Pressable>
      </View>

      <ActionMenuSheet
        visible={menuVisible}
        title={display.cardName}
        actions={[
          {
            label: 'Remove from inbox',
            destructive: true,
            onPress: () => setConfirmVisible(true),
          },
        ]}
        onClose={() => setMenuVisible(false)}
      />

      <ActionMenuSheet
        visible={confirmVisible}
        title="Remove conversation?"
        message={getHideConversationMessage(conversation)}
        actions={[
          {
            label: 'Remove',
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
