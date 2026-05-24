import type { InAppNotification } from '@notificationapi/core/dist/interfaces';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import {
  openNotificationTarget,
  useNotifications,
} from '@/contexts/NotificationContext';
import { useTheme, useThemedStyles } from '@/theme';

type NotificationsFeedModalProps = {
  visible: boolean;
  onClose: () => void;
};

function NotificationRow({
  item,
  onPress,
}: {
  item: InAppNotification;
  onPress: () => void;
}) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    row: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
      gap: spacing.xs,
      backgroundColor: item.seen ? colors.surface : colors.primarySubtle,
    },
    title: { ...typography.body, fontWeight: '600', color: colors.labelPrimary },
    date: { fontSize: 12, color: colors.labelSecondary },
  }));

  const dateLabel = item.date ? new Date(item.date).toLocaleString() : '';

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Text style={styles.title}>{item.title}</Text>
      {dateLabel ? <Text style={styles.date}>{dateLabel}</Text> : null}
    </Pressable>
  );
}

export function NotificationsFeedModal({ visible, onClose }: NotificationsFeedModalProps) {
  const { colors } = useTheme();
  const { notifications, unreadCount, markRead, markAllRead, refreshNotifications } =
    useNotifications();

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    sheet: {
      maxHeight: '80%',
      backgroundColor: colors.surface,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
    },
    headerTitle: { ...typography.body, fontWeight: '700', fontSize: 17 },
    markAll: { fontSize: 14, fontWeight: '600', color: colors.primary },
    empty: {
      padding: spacing.xl,
      alignItems: 'center',
      gap: spacing.sm,
    },
    emptyText: typography.subtitle,
  }));

  const handleOpen = async (item: InAppNotification) => {
    if (!item.seen) {
      await markRead([item.id]);
    }
    openNotificationTarget(item);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              {unreadCount > 0 ? (
                <Pressable onPress={() => void markAllRead()}>
                  <Text style={styles.markAll}>Mark all read</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={onClose} accessibilityLabel="Close notifications">
                <Ionicons name="close" size={24} color={colors.labelPrimary} />
              </Pressable>
            </View>
          </View>
          <ScrollView
            onScrollBeginDrag={() => void refreshNotifications()}
            keyboardShouldPersistTaps="handled">
            {notifications.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="notifications-outline" size={32} color={colors.labelSecondary} />
                <Text style={styles.emptyText}>No notifications yet.</Text>
              </View>
            ) : (
              notifications.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  onPress={() => void handleOpen(item)}
                />
              ))
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
