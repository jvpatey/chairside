import type { MessageDeliveryStatus } from '@chairside/api';
import { DELETED_MESSAGE_BODY } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { SearchMatchText } from '@/components/messaging/SearchMatchText';
import { ActionMenuSheet } from '@/components/ui/ActionMenuSheet';
import { copyMessageText } from '@/lib/copyText';
import { getMessageBubbleRadii } from '@/lib/messageThreadDisplay';
import { webHover, webIconButtonHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type MessageBubbleProps = {
  body: string;
  createdAt: string;
  isOwn: boolean;
  showTimestamp?: boolean;
  groupedWithPrevious?: boolean;
  groupedWithNext?: boolean;
  status?: 'sent' | 'pending' | 'failed';
  deliveryStatus?: MessageDeliveryStatus | null;
  showDeliveryStatus?: boolean;
  highlighted?: boolean;
  highlightQuery?: string;
  animateEntry?: boolean;
  onDelete?: () => Promise<void> | void;
};

function formatDeliveryLabel(status: MessageDeliveryStatus): string {
  switch (status) {
    case 'pending':
      return 'Sending…';
    case 'failed':
      return 'Failed to send';
    case 'delivered':
      return 'Delivered';
    case 'read':
      return 'Read';
    default:
      return '';
  }
}

export function MessageBubble({
  body,
  createdAt,
  isOwn,
  showTimestamp = true,
  groupedWithPrevious = false,
  groupedWithNext = false,
  status = 'sent',
  deliveryStatus,
  showDeliveryStatus = false,
  highlighted = false,
  highlightQuery,
  animateEntry = true,
  onDelete,
}: MessageBubbleProps) {
  const { colors } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [rowHovered, setRowHovered] = useState(false);
  const isWeb = Platform.OS === 'web';
  const isRemoved = body === DELETED_MESSAGE_BODY;
  const canDelete = Boolean(onDelete && status === 'sent' && !isRemoved);
  const canCopy = !isRemoved && body.trim().length > 0;
  const hasMenuActions = canDelete || canCopy;
  const showMenuButton = hasMenuActions;
  const bubbleRadii = getMessageBubbleRadii(isOwn, groupedWithPrevious, groupedWithNext);
  const showMeta = showTimestamp || status !== 'sent' || showDeliveryStatus;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    row: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: isOwn ? 'flex-end' : 'flex-start',
      gap: spacing.sm,
      marginTop: groupedWithPrevious ? 3 : spacing.sm,
    },
    column: {
      maxWidth: '78%',
      alignItems: isOwn ? 'flex-end' : 'flex-start',
    },
    bubble: {
      paddingHorizontal: spacing.md,
      paddingTop: groupedWithPrevious ? 6 : spacing.sm,
      paddingBottom: groupedWithNext ? 6 : spacing.sm,
      backgroundColor: isOwn ? colors.primary : colors.surface,
      borderWidth: isOwn ? 0 : 1,
      borderColor: colors.separator,
      opacity: status === 'pending' ? 0.72 : 1,
      overflow: 'hidden' as const,
      ...bubbleRadii,
    },
    bubbleHighlighted: {
      borderWidth: 2,
      borderColor: isOwn ? colors.primaryOnPrimary : colors.primary,
      ...(isOwn
        ? undefined
        : { backgroundColor: colors.primarySubtle }),
    },
    body: {
      ...typography.body,
      color: isOwn ? colors.primaryOnPrimary : colors.labelPrimary,
      fontStyle: isRemoved ? 'italic' : 'normal',
    },
    bodyHighlight: {
      fontWeight: '700',
      color: isOwn ? colors.primaryOnPrimary : colors.labelPrimary,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: 4,
    },
    timestamp: {
      fontSize: 11,
      color: colors.labelTertiary,
    },
    statusFailed: {
      fontSize: 11,
      color: colors.destructive,
      fontWeight: '600',
    },
    deliveryStatus: {
      fontSize: 11,
      color: deliveryStatus === 'read' ? colors.primary : colors.labelTertiary,
      fontWeight: deliveryStatus === 'read' ? '600' : '500',
    },
    bubbleWrap: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 4,
      maxWidth: '100%',
    },
    bubbleWrapOwn: {
      flexDirection: 'row-reverse',
    },
    menuButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
      flexShrink: 0,
      opacity: isWeb ? (rowHovered || menuVisible ? 1 : 0.85) : 0.85,
      ...webPointer(),
    },
    menuButtonHovered: webIconButtonHoverStyles(colors),
    menuButtonPressed: {
      opacity: 0.75,
    },
  }));

  const timestamp = formatBubbleTime(createdAt);
  const activeHighlightQuery = highlightQuery?.trim();
  const resolvedDeliveryStatus =
    deliveryStatus ?? (status === 'pending' ? 'pending' : status === 'failed' ? 'failed' : 'delivered');

  const accessibilityLabel = [
    isOwn ? 'You said' : 'They said',
    body,
    showTimestamp ? timestamp : null,
    status === 'pending' ? 'Sending' : null,
    status === 'failed' ? 'Failed to send' : null,
    showDeliveryStatus ? formatDeliveryLabel(resolvedDeliveryStatus) : null,
    highlighted ? 'Search match' : null,
  ]
    .filter(Boolean)
    .join('. ');

  const handleLongPress = () => {
    if (!hasMenuActions) return;
    openMenu();
  };

  const openMenu = () => {
    if (!hasMenuActions) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMenuVisible(true);
  };

  const handleCopy = () => {
    void copyMessageText(body).then((copied) => {
      if (copied && Platform.OS !== 'web') {
        Alert.alert('Copied', 'Message copied to clipboard.');
      }
    });
  };

  const handleDeleteConfirmed = async () => {
    try {
      await onDelete?.();
    } catch (error) {
      Alert.alert(
        'Could not delete message',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  const bubbleBody = activeHighlightQuery ? (
    <SearchMatchText
      text={body}
      query={activeHighlightQuery}
      style={styles.body}
      highlightStyle={styles.bodyHighlight}
    />
  ) : (
    <Text style={styles.body} selectable>
      {body}
    </Text>
  );

  const bubbleStyle = [styles.bubble, highlighted && styles.bubbleHighlighted];

  const bubble = (
    <Pressable
      onLongPress={handleLongPress}
      delayLongPress={350}
      style={bubbleStyle}
    >
      {bubbleBody}
    </Pressable>
  );

  const content = (
    <>
      <Pressable
        style={styles.row}
        accessibilityRole="text"
        accessibilityLabel={accessibilityLabel}
        {...(isWeb
          ? {
              onMouseEnter: () => setRowHovered(true),
              onMouseLeave: () => setRowHovered(false),
            }
          : {})}
      >
        <View style={styles.column}>
          <View style={[styles.bubbleWrap, isOwn && styles.bubbleWrapOwn]}>
            {showMenuButton ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Message options"
                hitSlop={8}
                onPress={(event) => {
                  event.stopPropagation?.();
                  openMenu();
                }}
                style={({ pressed, hovered }) => [
                  styles.menuButton,
                  webHover(hovered, pressed, styles.menuButtonHovered),
                  pressed && styles.menuButtonPressed,
                ]}
              >
                <Ionicons name="ellipsis-horizontal" size={16} color={colors.labelTertiary} />
              </Pressable>
            ) : null}
            {bubble}
          </View>
          {showMeta ? (
            <View style={styles.metaRow}>
              {status === 'pending' ? (
                <ActivityIndicator color={colors.primary} size={10} />
              ) : null}
              {showTimestamp && timestamp ? <Text style={styles.timestamp}>{timestamp}</Text> : null}
              {status === 'failed' ? <Text style={styles.statusFailed}>Failed to send</Text> : null}
              {showDeliveryStatus && isOwn && status === 'sent' ? (
                <Text style={styles.deliveryStatus}>{formatDeliveryLabel(resolvedDeliveryStatus)}</Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </Pressable>

      <ActionMenuSheet
        visible={menuVisible}
        title="Message"
        actions={[
          ...(canCopy
            ? [
                {
                  label: 'Copy text',
                  onPress: handleCopy,
                },
              ]
            : []),
          ...(canDelete
            ? [
                {
                  label: 'Delete message',
                  destructive: true,
                  onPress: () => setConfirmVisible(true),
                },
              ]
            : []),
        ]}
        onClose={() => setMenuVisible(false)}
      />

      {canDelete ? (
        <ActionMenuSheet
          visible={confirmVisible}
          title="Delete message?"
          message="This removes the message for everyone in the thread."
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
      ) : null}
    </>
  );

  if (!animateEntry) return content;

  return (
    <Animated.View entering={FadeIn.duration(160)}>
      {content}
    </Animated.View>
  );
}

function formatBubbleTime(isoDate: string): string | null {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
