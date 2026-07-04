import type { Conversation } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';

import { SearchMatchText } from '@/components/messaging/SearchMatchText';
import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { ActionMenuSheet } from '@/components/ui/ActionMenuSheet';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import { useWorkerPhotoUri } from '@/hooks/useWorkerPhotoUri';
import {
  formatConversationDisplay,
  getConversationTypeChip,
  getConversationTypeChipColors,
} from '@/lib/conversationDisplay';
import { getHideConversationMessage } from '@/lib/conversationHide';
import { formatNotificationTime } from '@/lib/notificationDisplay';
import {
  formatInboxPreviewText,
  getLastOwnMessageDeliveryStatus,
} from '@/lib/messageThreadDisplay';
import {
  webHover,
  webIconButtonHoverStyles,
  webListRowHoverStyles,
  webPointer,
} from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type ConversationListItemProps = {
  conversation: Conversation;
  avatarKind: 'clinic' | 'worker';
  role: 'worker' | 'clinic';
  viewerId: string;
  onPress: () => void;
  onDelete?: () => void;
  selected?: boolean;
  messageSearchPreview?: string | null;
  searchQuery?: string;
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

function DeliveryGlyph({
  status,
}: {
  status: ReturnType<typeof getLastOwnMessageDeliveryStatus>;
}) {
  const { colors } = useTheme();
  if (!status || status === 'pending' || status === 'failed') return null;

  const iconName =
    status === 'read' ? 'checkmark-done' : ('checkmark' as 'checkmark-done' | 'checkmark');
  const color = status === 'read' ? colors.primary : colors.labelTertiary;

  return <Ionicons name={iconName} size={14} color={color} accessibilityLabel={status} />;
}

export function ConversationListItem({
  conversation,
  avatarKind,
  role,
  viewerId,
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
  const typeChip = getConversationTypeChip(conversation);
  const typeChipColors = getConversationTypeChipColors(typeChip.tone);
  const chipBg = colors[typeChipColors.bg as keyof typeof colors] ?? colors.fillSubtle;
  const chipText = colors[typeChipColors.text as keyof typeof colors] ?? colors.labelSecondary;
  const activeSearchQuery = searchQuery.trim();
  const previewText =
    messageSearchPreview ??
    (activeSearchQuery ? conversation.last_message_preview : formatInboxPreviewText(conversation, viewerId)) ??
    'No messages yet';
  const isEmptyPreview = previewText === 'No messages yet';
  const ownDeliveryStatus = getLastOwnMessageDeliveryStatus(conversation, role, viewerId);

  const avatarSize = compact ? 40 : 48;
  const primaryTitle = compact ? display.inboxContextLine : display.cardName;
  const secondaryLine = compact ? display.cardName : display.cardTitle;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'stretch',
      paddingVertical: compact ? spacing.md : spacing.md,
      paddingHorizontal: compact ? spacing.md : spacing.md,
      position: 'relative' as const,
      backgroundColor: 'transparent',
      borderRadius: compact ? 14 : 0,
    },
    rowSelected: {
      backgroundColor: colors.fillSubtle,
    },
    rowHovered: webListRowHoverStyles(colors),
    mainPressable: {
      flex: 1,
      flexDirection: 'row',
      alignItems: compact ? 'flex-start' : 'center',
      gap: compact ? 0 : spacing.md,
      minWidth: 0,
      ...webPointer(),
    },
    mainPressed: {
      opacity: 0.92,
    },
    textWrap: { flex: 1, gap: compact ? 6 : 4, minWidth: 0, paddingRight: spacing.xs },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    titleRowWithMenu: {
      paddingRight: 36,
    },
    name: {
      ...typography.body,
      fontSize: compact ? 15 : 17,
      lineHeight: compact ? 20 : 22,
      fontWeight: conversation.unread || selected ? '700' : '600',
      letterSpacing: -0.2,
      color: colors.labelPrimary,
      flex: 1,
    },
    counterpart: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.labelTertiary,
      fontWeight: '500',
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexShrink: 0,
      paddingTop: 2,
    },
    contextRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    typeChip: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: chipBg,
    },
    typeChipText: {
      fontSize: 10,
      fontWeight: '700',
      color: chipText,
      letterSpacing: 0.3,
      textTransform: 'uppercase' as const,
    },
    context: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
      flexShrink: 1,
    },
    preview: {
      fontSize: 13,
      lineHeight: 18,
      color: isEmptyPreview
        ? colors.labelTertiary
        : activeSearchQuery
          ? colors.labelSecondary
          : conversation.unread
            ? colors.labelPrimary
            : colors.labelSecondary,
      fontStyle: isEmptyPreview ? 'italic' : 'normal',
      fontWeight: activeSearchQuery ? '400' : conversation.unread ? '600' : '400',
      flex: 1,
    },
    previewHighlight: {
      fontWeight: '700',
      color: colors.labelPrimary,
    },
    previewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
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
      color: conversation.unread ? colors.primary : colors.labelTertiary,
      fontWeight: conversation.unread ? '600' : '400',
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
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
    typeChip.label,
    display.inboxContextLine,
    conversation.unread ? 'Unread' : null,
    previewText,
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
          {!compact ? (
            <ConversationAvatar conversation={conversation} avatarKind={avatarKind} size={avatarSize} />
          ) : null}
          <View style={styles.textWrap}>
            <View style={[styles.titleRow, onDelete ? styles.titleRowWithMenu : null]}>
              <View style={{ flex: 1, gap: compact ? 4 : 0, minWidth: 0 }}>
                {activeSearchQuery ? (
                  <SearchMatchText
                    text={primaryTitle}
                    query={activeSearchQuery}
                    style={styles.name}
                    highlightStyle={styles.nameHighlight}
                    numberOfLines={compact ? 2 : 1}
                  />
                ) : (
                  <Text style={styles.name} numberOfLines={compact ? 2 : 1}>
                    {primaryTitle}
                  </Text>
                )}
                {compact && secondaryLine ? (
                  <Text style={styles.counterpart} numberOfLines={1}>
                    {secondaryLine}
                  </Text>
                ) : null}
              </View>
              <View style={styles.metaRow}>
                {!compact ? (
                  <View style={styles.typeChip}>
                    <Text style={styles.typeChipText}>{typeChip.label}</Text>
                  </View>
                ) : null}
                {conversation.unread ? <View style={styles.unreadDot} /> : null}
                {timestamp ? <Text style={styles.timestamp}>{timestamp}</Text> : null}
              </View>
            </View>
            {!compact && display.inboxContextLine ? (
              <Text style={styles.context} numberOfLines={1}>
                {display.inboxContextLine}
              </Text>
            ) : null}
            <View style={[styles.previewRow, activeSearchQuery ? styles.previewRowExpanded : null]}>
              <DeliveryGlyph status={ownDeliveryStatus} />
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
            </View>
          </View>
          {isWeb && !compact ? (
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
