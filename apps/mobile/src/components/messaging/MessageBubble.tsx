import { ActivityIndicator, Text, View } from 'react-native';

import { SearchMatchText } from '@/components/messaging/SearchMatchText';
import { useTheme, useThemedStyles } from '@/theme';

type MessageBubbleProps = {
  body: string;
  createdAt: string;
  isOwn: boolean;
  showTimestamp?: boolean;
  groupedWithPrevious?: boolean;
  groupedWithNext?: boolean;
  status?: 'sent' | 'pending' | 'failed';
  highlighted?: boolean;
  highlightQuery?: string;
};

export function MessageBubble({
  body,
  createdAt,
  isOwn,
  showTimestamp = true,
  groupedWithPrevious = false,
  groupedWithNext = false,
  status = 'sent',
  highlighted = false,
  highlightQuery,
}: MessageBubbleProps) {
  const { colors } = useTheme();

  const styles = useThemedStyles(({ colors, spacing, typography }) => {
    const ownRadius = {
      borderTopLeftRadius: 16,
      borderTopRightRadius: groupedWithPrevious ? 6 : 16,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: groupedWithNext ? 6 : 16,
    };
    const otherRadius = {
      borderTopLeftRadius: groupedWithPrevious ? 6 : 16,
      borderTopRightRadius: 16,
      borderBottomLeftRadius: groupedWithNext ? 6 : 16,
      borderBottomRightRadius: 16,
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
    };
  });

  const timestamp = formatBubbleTime(createdAt);
  const activeHighlightQuery = highlightQuery?.trim();

  const accessibilityLabel = [
    isOwn ? 'You said' : 'They said',
    body,
    showTimestamp ? timestamp : null,
    status === 'pending' ? 'Sending' : null,
    status === 'failed' ? 'Failed to send' : null,
    highlighted ? 'Search match' : null,
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <View style={styles.row} accessibilityRole="text" accessibilityLabel={accessibilityLabel}>
      <View style={[styles.bubble, highlighted && styles.bubbleHighlighted]}>
        {activeHighlightQuery ? (
          <SearchMatchText
            text={body}
            query={activeHighlightQuery}
            style={styles.body}
            highlightStyle={styles.bodyHighlight}
          />
        ) : (
          <Text style={styles.body}>{body}</Text>
        )}
        {showTimestamp || status !== 'sent' ? (
          <View style={styles.metaRow}>
            {status === 'pending' ? (
              <ActivityIndicator
                color={isOwn ? colors.primaryOnPrimary : colors.primary}
                size={10}
              />
            ) : null}
            {showTimestamp && timestamp ? <Text style={styles.timestamp}>{timestamp}</Text> : null}
            {status === 'failed' ? <Text style={styles.statusFailed}>Failed to send</Text> : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function formatBubbleTime(isoDate: string): string | null {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
