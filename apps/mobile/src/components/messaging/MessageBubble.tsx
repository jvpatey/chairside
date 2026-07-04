import type { MessageDeliveryStatus } from '@chairside/api';
import { ActivityIndicator, Alert, Platform, Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { SearchMatchText } from '@/components/messaging/SearchMatchText';
import { copyMessageText } from '@/lib/copyText';
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

  const styles = useThemedStyles(({ colors, spacing, typography }) => {
    const ownRadius = {
      borderTopLeftRadius: 18,
      borderTopRightRadius: groupedWithPrevious ? 8 : 18,
      borderBottomLeftRadius: 18,
      borderBottomRightRadius: groupedWithNext ? 8 : 18,
    };
    const otherRadius = {
      borderTopLeftRadius: groupedWithPrevious ? 8 : 18,
      borderTopRightRadius: 18,
      borderBottomLeftRadius: groupedWithNext ? 8 : 18,
      borderBottomRightRadius: 18,
    };

    return {
      row: {
        flexDirection: 'row',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        marginTop: groupedWithPrevious ? 2 : spacing.xs,
      },
      bubble: {
        maxWidth: '82%',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: isOwn ? colors.primary : colors.surface,
        borderWidth: isOwn ? 0 : 1,
        borderColor: colors.separator,
        gap: spacing.xs,
        opacity: status === 'pending' ? 0.72 : 1,
        ...(isOwn ? ownRadius : otherRadius),
      },
      bubbleHighlighted: {
        borderWidth: 2,
        borderColor: isOwn ? colors.primaryOnPrimary : colors.primary,
        ...(isOwn
          ? { backgroundColor: colors.primary }
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
        alignSelf: isOwn ? 'flex-end' : 'flex-start',
      },
      timestamp: {
        fontSize: 11,
        color: isOwn ? `${colors.primaryOnPrimary}CC` : colors.labelTertiary,
      },
      statusFailed: {
        fontSize: 11,
        color: isOwn ? `${colors.primaryOnPrimary}CC` : colors.destructive,
        fontWeight: '600',
      },
      deliveryStatus: {
        fontSize: 11,
        color: isOwn ? `${colors.primaryOnPrimary}CC` : colors.labelTertiary,
        fontWeight: deliveryStatus === 'read' ? '600' : '500',
      },
    };
  });

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

  const bubbleContent = (
    <Pressable
      onLongPress={handleLongPress}
      delayLongPress={350}
      style={[styles.bubble, highlighted && styles.bubbleHighlighted]}>
      {activeHighlightQuery ? (
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
      )}
      {showTimestamp || status !== 'sent' || showDeliveryStatus ? (
        <View style={styles.metaRow}>
          {status === 'pending' ? (
            <ActivityIndicator color={isOwn ? colors.primaryOnPrimary : colors.primary} size={10} />
          ) : null}
          {showTimestamp && timestamp ? <Text style={styles.timestamp}>{timestamp}</Text> : null}
          {status === 'failed' ? <Text style={styles.statusFailed}>Failed to send</Text> : null}
          {showDeliveryStatus && isOwn && status === 'sent' ? (
            <Text style={styles.deliveryStatus}>{formatDeliveryLabel(resolvedDeliveryStatus)}</Text>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );

  const content = (
    <View style={styles.row} accessibilityRole="text" accessibilityLabel={accessibilityLabel}>
      {bubbleContent}
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
