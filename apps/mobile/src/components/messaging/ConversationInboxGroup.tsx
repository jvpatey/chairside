import type { Conversation } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { SearchMatchText } from '@/components/messaging/SearchMatchText';
import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { ActionMenuSheet } from '@/components/ui/ActionMenuSheet';
import { cardShellRadii } from '@/components/ui/cardLayout';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import { useWorkerPhotoUri } from '@/hooks/useWorkerPhotoUri';
import { formatConversationDisplay } from '@/lib/conversationDisplay';
import { getHideConversationMessage } from '@/lib/conversationHide';
import { formatMessageSearchPreview } from '@/lib/messageThreadDisplay';
import { formatNotificationTime } from '@/lib/notificationDisplay';
import type { MessageThreadFocus } from '@/lib/routing';
import {
  webHover,
  webIconButtonHoverStyles,
  webListRowHoverStyles,
  webListRowSelectedStyles,
  webPointer,
} from '@/lib/webPressableStyles';
import { colorWithAlpha, useTheme, useThemedStyles } from '@/theme';

type ConversationInboxGroupProps = {
  threads: Conversation[];
  avatarKind: 'clinic' | 'worker';
  role: 'worker' | 'clinic';
  compact?: boolean;
  selectedConversationId?: string | null;
  searchQuery?: string;
  messageSearchHits: Record<string, { id: string; body: string } | undefined>;
  debouncedQuery: string;
  onConversationPress: (conversation: Conversation, focus?: MessageThreadFocus) => void;
  onDelete: (conversation: Conversation) => Promise<void>;
  getConversationFocus: (conversation: Conversation) => MessageThreadFocus | undefined;
};

function GroupAvatar({
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

type ThreadRowProps = {
  conversation: Conversation;
  role: 'worker' | 'clinic';
  compact?: boolean;
  selected?: boolean;
  searchQuery: string;
  messageSearchPreview?: string | null;
  onPress: () => void;
  onDelete: () => Promise<void>;
};

function ConversationInboxThreadRow({
  conversation,
  role,
  compact = false,
  selected = false,
  searchQuery,
  messageSearchPreview,
  onPress,
  onDelete,
}: ThreadRowProps) {
  const { colors } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [rowHovered, setRowHovered] = useState(false);
  const isWeb = Platform.OS === 'web';
  const display = formatConversationDisplay(conversation, role);
  const activeSearchQuery = searchQuery.trim();
  const timestamp = formatNotificationTime(conversation.last_message_at ?? undefined);
  const previewText =
    messageSearchPreview ?? conversation.last_message_preview ?? 'No messages yet';
  const isEmptyPreview = previewText === 'No messages yet';

  const styles = useThemedStyles(({ colors, spacing, typography, isDark }) => ({
    card: {
      borderRadius: cardShellRadii.inner,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colorWithAlpha(colors.separator, isDark ? 0.65 : 0.55),
      backgroundColor: conversation.unread ? colors.primarySubtle : colors.surfaceElevated,
      overflow: 'hidden',
      position: 'relative' as const,
    },
    cardSelected: webListRowSelectedStyles(colors),
    cardHovered: webListRowHoverStyles(colors),
    selectedAccent: {
      position: 'absolute' as const,
      left: 0,
      top: spacing.xs,
      bottom: spacing.xs,
      width: 3,
      borderRadius: 2,
      backgroundColor: colors.primary,
    },
    pressable: {
      paddingVertical: compact ? spacing.sm : spacing.sm + 2,
      paddingHorizontal: compact ? spacing.sm : spacing.md,
      paddingRight: spacing.xl + spacing.sm,
      gap: spacing.xs,
      ...webPointer(),
    },
    pressablePressed: {
      opacity: 0.92,
    },
    contextRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    context: {
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    timestamp: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.labelTertiary,
      flexShrink: 0,
    },
    previewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    preview: {
      flex: 1,
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
    },
    previewHighlight: {
      fontWeight: '700',
      color: colors.labelPrimary,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
      flexShrink: 0,
    },
    menuButton: {
      position: 'absolute' as const,
      top: spacing.xs,
      right: spacing.xs,
      zIndex: 2,
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      opacity: isWeb ? (rowHovered ? 1 : 0) : 0.7,
      ...webPointer(),
    },
    menuButtonHovered: webIconButtonHoverStyles(colors),
    menuButtonPressed: {
      opacity: 0.75,
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
      <View
        style={[
          styles.card,
          selected && styles.cardSelected,
          isWeb && rowHovered && !selected && styles.cardHovered,
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
            <Ionicons name="ellipsis-horizontal" size={16} color={colors.labelTertiary} />
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={[display.inboxContextLine, previewText].filter(Boolean).join('. ')}
          accessibilityState={{ selected }}
          onPress={onPress}
          style={({ pressed }) => [styles.pressable, pressed && styles.pressablePressed]}>
          <View style={styles.contextRow}>
            <Text style={styles.context} numberOfLines={compact ? 1 : 2}>
              {display.inboxContextLine}
            </Text>
            {timestamp ? <Text style={styles.timestamp}>{timestamp}</Text> : null}
          </View>
          <View style={styles.previewRow}>
            {activeSearchQuery && !isEmptyPreview ? (
              <SearchMatchText
                text={previewText}
                query={activeSearchQuery}
                style={styles.preview}
                highlightStyle={styles.previewHighlight}
                numberOfLines={compact ? 2 : 1}
              />
            ) : (
              <Text style={styles.preview} numberOfLines={compact ? 2 : 1}>
                {previewText}
              </Text>
            )}
            {conversation.unread ? <View style={styles.unreadDot} /> : null}
          </View>
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

export function ConversationInboxGroup({
  threads,
  avatarKind,
  role,
  compact = false,
  selectedConversationId,
  searchQuery = '',
  messageSearchHits,
  debouncedQuery,
  onConversationPress,
  onDelete,
  getConversationFocus,
}: ConversationInboxGroupProps) {
  const { colors } = useTheme();
  const lead = threads[0];
  const [expanded, setExpanded] = useState(false);
  const [headerHovered, setHeaderHovered] = useState(false);
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    if (selectedConversationId && threads.some((thread) => thread.id === selectedConversationId)) {
      setExpanded(true);
    }
  }, [selectedConversationId, threads]);

  if (!lead) return null;

  const avatarSize = compact ? 36 : 40;
  const hasUnread = threads.some((thread) => thread.unread);
  const unreadCount = threads.filter((thread) => thread.unread).length;
  const threadLabel = threads.length === 1 ? '1 thread' : `${threads.length} threads`;
  const leadDisplay = formatConversationDisplay(lead, role);
  const leadTimestamp = formatNotificationTime(lead.last_message_at ?? undefined);
  const leadPreview = lead.last_message_preview ?? 'No messages yet';
  const isEmptyLeadPreview = leadPreview === 'No messages yet';

  const toggleExpanded = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded((current) => !current);
  };

  const styles = useThemedStyles(({ colors, spacing, typography, isDark }) => ({
    shell: {
      backgroundColor: colors.surface,
      borderRadius: cardShellRadii.group,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colorWithAlpha(colors.separator, isDark ? 0.65 : 0.55),
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: compact ? spacing.sm : spacing.md,
      paddingVertical: compact ? spacing.sm + 2 : spacing.md,
      backgroundColor: colors.surface,
      ...webPointer(),
    },
    headerExpanded: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colorWithAlpha(colors.separator, isDark ? 0.45 : 0.35),
    },
    headerHovered: webListRowHoverStyles(colors),
    headerPressed: {
      opacity: 0.92,
    },
    headerText: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    name: {
      ...typography.body,
      fontSize: 17,
      lineHeight: 22,
      fontWeight: hasUnread ? '700' : '600',
      letterSpacing: -0.2,
      color: colors.labelPrimary,
      flex: 1,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    threadBadge: {
      alignSelf: 'flex-start',
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '600',
      color: colors.labelSecondary,
      backgroundColor: colors.fillSubtle,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: 999,
      overflow: 'hidden',
    },
    collapsedContext: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
    collapsedPreview: {
      fontSize: 13,
      lineHeight: 18,
      color: isEmptyLeadPreview ? colors.labelTertiary : colors.labelSecondary,
      fontStyle: isEmptyLeadPreview ? 'italic' : 'normal',
      fontWeight: lead.unread ? '600' : '400',
      flex: 1,
    },
    timestamp: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.labelTertiary,
      flexShrink: 0,
    },
    chevronWrap: {
      flexShrink: 0,
      alignSelf: 'center',
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
      flexShrink: 0,
    },
    unreadBadge: {
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      paddingHorizontal: 5,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    unreadBadgeText: {
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '700',
      color: colors.primaryOnPrimary,
    },
    threads: {
      gap: spacing.sm,
      padding: compact ? spacing.sm : spacing.md,
      backgroundColor: colors.backgroundGrouped,
    },
  }));

  const headerAccessibilityLabel = [
    lead.counterpart_name,
    threadLabel,
    expanded ? 'Expanded' : 'Collapsed',
    !expanded ? leadDisplay.inboxContextLine : null,
    !expanded ? leadPreview : null,
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <View style={styles.shell}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={headerAccessibilityLabel}
        accessibilityState={{ expanded }}
        onPress={toggleExpanded}
        style={({ pressed }) => [
          styles.header,
          expanded && styles.headerExpanded,
          isWeb && headerHovered && styles.headerHovered,
          pressed && styles.headerPressed,
        ]}
        {...(isWeb
          ? {
              onMouseEnter: () => setHeaderHovered(true),
              onMouseLeave: () => setHeaderHovered(false),
            }
          : {})}>
        <GroupAvatar conversation={lead} avatarKind={avatarKind} size={avatarSize} />
        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {lead.counterpart_name}
            </Text>
            {!expanded && hasUnread ? (
              unreadCount > 1 ? (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                </View>
              ) : (
                <View style={styles.unreadDot} />
              )
            ) : null}
            {!expanded && leadTimestamp ? (
              <Text style={styles.timestamp}>{leadTimestamp}</Text>
            ) : null}
          </View>
          <Text style={styles.threadBadge}>{threadLabel}</Text>
          {!expanded ? (
            <>
              <Text style={styles.collapsedContext} numberOfLines={1}>
                {leadDisplay.inboxContextLine}
              </Text>
              <View style={styles.metaRow}>
                <Text style={styles.collapsedPreview} numberOfLines={1}>
                  {leadPreview}
                </Text>
              </View>
            </>
          ) : null}
        </View>
        <View style={styles.chevronWrap}>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.labelTertiary}
          />
        </View>
      </Pressable>
      {expanded ? (
        <View style={styles.threads}>
          {threads.map((conversation) => {
            const hit = messageSearchHits[conversation.id];
            const preview = hit
              ? formatMessageSearchPreview(hit.body, debouncedQuery || searchQuery)
              : null;

            return (
              <ConversationInboxThreadRow
                key={conversation.id}
                conversation={conversation}
                role={role}
                compact={compact}
                selected={conversation.id === selectedConversationId}
                searchQuery={searchQuery}
                messageSearchPreview={preview}
                onPress={() => onConversationPress(conversation, getConversationFocus(conversation))}
                onDelete={() => onDelete(conversation)}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
