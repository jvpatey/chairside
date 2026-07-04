import type { MessageDeliveryStatus } from '@chairside/api';
import { ActivityIndicator, Alert, Platform, Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { SearchMatchText } from '@/components/messaging/SearchMatchText';
import { copyMessageText } from '@/lib/copyText';
import { getMessageBubbleRadii } from '@/lib/messageThreadDisplay';
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
}: MessageBubbleProps) {
  const { colors } = useTheme();
  const bubbleRadii = getMessageBubbleRadii(isOwn, groupedWithPrevious, groupedWithNext);
  const showMeta = showTimestamp || status !== 'sent' || showDeliveryStatus;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    row: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: isOwn ? 'flex-end' : 'flex-start',
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
    void copyMessageText(body).then((copied) => {
      if (copied && Platform.OS !== 'web') {
        Alert.alert('Copied', 'Message copied to clipboard.');
      }
    });
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
    <Pressable onLongPress={handleLongPress} delayLongPress={350} style={bubbleStyle}>
      {bubbleBody}
    </Pressable>
  );

  const content = (
    <View style={styles.row} accessibilityRole="text" accessibilityLabel={accessibilityLabel}>
      <View style={styles.column}>
        {bubble}
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
    </View>
  );

  if (!animateEntry) return content;

  return (
    <Animated.View entering={FadeInDown.duration(180).springify().damping(18)}>
      {content}
    </Animated.View>
  );
}

function formatBubbleTime(isoDate: string): string | null {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
