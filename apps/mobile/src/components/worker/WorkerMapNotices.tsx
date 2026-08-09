import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type WorkerMapNoticesProps = {
  unmappableCount: number;
  workerHasCoordinates: boolean;
};

type NoticeId = 'province' | 'unmappable';

type Notice = {
  id: NoticeId;
  title: string;
  body: string;
};

/** Dismissible informational banners shown above the browse map. */
export function WorkerMapNotices({ unmappableCount, workerHasCoordinates }: WorkerMapNoticesProps) {
  const { colors } = useTheme();
  const [dismissed, setDismissed] = useState<NoticeId[]>([]);

  const dismiss = useCallback((id: NoticeId) => {
    setDismissed((current) => (current.includes(id) ? current : [...current, id]));
  }, []);

  const notices = useMemo(() => {
    const next: Notice[] = [];

    if (!workerHasCoordinates) {
      next.push({
        id: 'province',
        title: 'Showing your province',
        body: 'Add your worker address in profile setup to center the map near you and improve distance sorting.',
      });
    }

    if (unmappableCount > 0) {
      next.push({
        id: 'unmappable',
        title: `${unmappableCount} posting${unmappableCount === 1 ? '' : 's'} hidden from map`,
        body: 'Some clinics are missing coordinates. Switch to list view to see every matching posting.',
      });
    }

    return next.filter((notice) => !dismissed.includes(notice.id));
  }, [dismissed, unmappableCount, workerHasCoordinates]);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    notices: {
      gap: spacing.sm,
      marginBottom: spacing.md,
      flexShrink: 0,
    },
    notice: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      backgroundColor: colors.fillSubtle,
      borderRadius: 12,
      padding: spacing.md,
    },
    noticeText: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
    },
    noticeTitle: {
      ...typography.subtitle,
      fontSize: 14,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    noticeBody: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
    dismissButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      ...webPointer(),
    },
    dismissButtonPressed: {
      opacity: 0.6,
    },
  }));

  if (notices.length === 0) return null;

  return (
    <View style={styles.notices}>
      {notices.map((notice) => (
        <View key={notice.id} style={styles.notice}>
          <View style={styles.noticeText}>
            <Text style={styles.noticeTitle}>{notice.title}</Text>
            <Text style={styles.noticeBody}>{notice.body}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Dismiss notice: ${notice.title}`}
            hitSlop={8}
            onPress={() => dismiss(notice.id)}
            style={({ pressed }) => [styles.dismissButton, pressed && styles.dismissButtonPressed]}>
            <Ionicons name="close" size={16} color={colors.labelSecondary} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}
