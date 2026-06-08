import type { InAppNotification } from '@notificationapi/core/dist/interfaces';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  openNotificationTarget,
  useNotifications,
} from '@/contexts/NotificationContext';
import {
  formatNotificationTime,
  getNotificationAccentBackground,
  getNotificationAccentColor,
  getNotificationDisplayMeta,
} from '@/lib/notificationDisplay';
import {
  webHover,
  webListRowHoverStyles,
  webPointer,
  webTextLinkHoverStyles,
} from '@/lib/webPressableStyles';
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
  const { colors } = useTheme();
  const meta = getNotificationDisplayMeta(item.notificationId);
  const accent = getNotificationAccentColor(colors, meta.accent);
  const iconBackground = getNotificationAccentBackground(colors, meta.accent);
  const timeLabel = formatNotificationTime(item.date);
  const isUnread = !item.seen;

  const styles = useThemedStyles(({ colors, spacing }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      minHeight: 72,
      ...webPointer(),
    },
    rowHovered: webListRowHoverStyles(colors),
    rowPressed: {
      backgroundColor: colors.fillSubtle,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: {
      flex: 1,
      gap: 2,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    title: {
      flex: 1,
      fontSize: 16,
      lineHeight: 21,
      color: colors.labelPrimary,
    },
    titleUnread: {
      fontWeight: '600',
    },
    titleRead: {
      fontWeight: '400',
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      flexWrap: 'wrap',
    },
    time: {
      fontSize: 13,
      color: colors.labelTertiary,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
      marginTop: 6,
    },
    chevron: {
      marginTop: 2,
    },
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}${isUnread ? ', unread' : ''}`}
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.row,
        webHover(hovered, pressed, styles.rowHovered),
        pressed && styles.rowPressed,
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: iconBackground }]}>
        <Ionicons name={meta.icon} size={22} color={accent} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.title, isUnread ? styles.titleUnread : styles.titleRead]}
            numberOfLines={2}>
            {item.title}
          </Text>
          {isUnread ? <View style={styles.unreadDot} accessibilityElementsHidden /> : null}
        </View>
        <View style={styles.meta}>
          <Text style={styles.subtitle} numberOfLines={1}>
            {meta.subtitle}
          </Text>
          {timeLabel ? (
            <>
              <Text style={styles.time} accessibilityElementsHidden>
                ·
              </Text>
              <Text style={styles.time}>{timeLabel}</Text>
            </>
          ) : null}
        </View>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={colors.labelTertiary}
        style={styles.chevron}
      />
    </Pressable>
  );
}

export function NotificationsFeedModal({ visible, onClose }: NotificationsFeedModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { notifications, unreadCount, isReady, markRead, markAllRead, refreshNotifications } =
    useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    sheet: {
      maxHeight: '88%',
      backgroundColor: colors.backgroundGrouped,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      overflow: 'hidden',
    },
    handle: {
      alignSelf: 'center',
      width: 36,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.separator,
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      letterSpacing: -0.4,
      color: colors.labelPrimary,
    },
    textActionPressable: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.xs,
      marginRight: -spacing.xs,
      borderRadius: 8,
      ...webPointer(),
    },
    textAction: {
      fontSize: 17,
      fontWeight: '400',
      color: colors.primary,
    },
    textActionHovered: webTextLinkHoverStyles(colors),
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    toolbarHint: {
      fontSize: 13,
      color: colors.labelSecondary,
    },
    markAllPressable: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.xs,
      marginRight: -spacing.xs,
      borderRadius: 8,
      ...webPointer(),
    },
    markAll: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
    markAllHovered: webTextLinkHoverStyles(colors),
    listCard: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: 12,
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
        },
        android: { elevation: 1 },
      }),
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
      marginLeft: 76,
    },
    empty: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      paddingVertical: spacing.xl * 1.5,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: 12,
    },
    emptyIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.fillSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.labelPrimary,
      textAlign: 'center',
    },
    emptyText: {
      ...typography.subtitle,
      fontSize: 15,
      textAlign: 'center',
      maxWidth: 280,
    },
    loading: {
      paddingVertical: spacing.xl,
      alignItems: 'center',
    },
    scrollBottom: {
      height: spacing.md,
    },
  }));

  useEffect(() => {
    if (visible) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      void refreshNotifications();
    }
  }, [visible, refreshNotifications]);

  const handleClose = useCallback(() => {
    void Haptics.selectionAsync();
    onClose();
  }, [onClose]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshNotifications();
    } finally {
      setRefreshing(false);
    }
  }, [refreshNotifications]);

  const handleOpen = async (item: InAppNotification) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!item.seen) {
      await markRead([item.id]);
    }
    openNotificationTarget(item);
    onClose();
  };

  const handleMarkAll = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    void markAllRead();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
      onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}
          onPress={(event) => event.stopPropagation()}>
          <View style={styles.handle} accessibilityElementsHidden />

          <View style={styles.header}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Pressable
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Done"
              style={({ pressed, hovered }) => [
                styles.textActionPressable,
                webHover(hovered, pressed, styles.textActionHovered),
              ]}>
              <Text style={styles.textAction}>Done</Text>
            </Pressable>
          </View>

          {unreadCount > 0 ? (
            <View style={styles.toolbar}>
              <Text style={styles.toolbarHint}>
                {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
              </Text>
              <Pressable
                onPress={handleMarkAll}
                accessibilityRole="button"
                accessibilityLabel="Mark all notifications as read"
                style={({ pressed, hovered }) => [
                  styles.markAllPressable,
                  webHover(hovered, pressed, styles.markAllHovered),
                ]}>
                <Text style={styles.markAll}>Mark All Read</Text>
              </Pressable>
            </View>
          ) : null}

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => void handleRefresh()}
                tintColor={colors.labelSecondary}
              />
            }>
            {!isReady ? (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : notifications.length === 0 ? (
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="notifications-outline" size={28} color={colors.labelSecondary} />
                </View>
                <Text style={styles.emptyTitle}>You&apos;re all caught up</Text>
                <Text style={styles.emptyText}>
                  When clinics or workers interact with your posts and applications, updates will
                  show up here.
                </Text>
              </View>
            ) : (
              <View style={styles.listCard}>
                {notifications.map((item, index) => (
                  <View key={item.id}>
                    <NotificationRow item={item} onPress={() => void handleOpen(item)} />
                    {index < notifications.length - 1 ? <View style={styles.separator} /> : null}
                  </View>
                ))}
              </View>
            )}
            <View style={styles.scrollBottom} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
