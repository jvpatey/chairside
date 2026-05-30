import { Text, View } from 'react-native';

import { formatNotificationTime } from '@/lib/notificationDisplay';
import { useThemedStyles } from '@/theme';

type MessageBubbleProps = {
  body: string;
  createdAt: string;
  isOwn: boolean;
};

export function MessageBubble({ body, createdAt, isOwn }: MessageBubbleProps) {
  const timestamp = formatNotificationTime(createdAt);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    row: {
      flexDirection: 'row',
      justifyContent: isOwn ? 'flex-end' : 'flex-start',
    },
    bubble: {
      maxWidth: '82%',
      borderRadius: 16,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: isOwn ? colors.primary : colors.surface,
      borderWidth: isOwn ? 0 : 1,
      borderColor: colors.separator,
      gap: spacing.xs,
    },
    body: {
      ...typography.body,
      color: isOwn ? colors.primaryOnPrimary : colors.labelPrimary,
    },
    timestamp: {
      fontSize: 11,
      color: isOwn ? `${colors.primaryOnPrimary}CC` : colors.labelTertiary,
      alignSelf: isOwn ? 'flex-end' : 'flex-start',
    },
  }));

  return (
    <View style={styles.row}>
      <View style={styles.bubble}>
        <Text style={styles.body}>{body}</Text>
        {timestamp ? <Text style={styles.timestamp}>{timestamp}</Text> : null}
      </View>
    </View>
  );
}
