import type { InAppNotification } from '@notificationapi/core/dist/interfaces';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

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
  adaptiveSheetCenteredBody,
  adaptiveSheetHeader,
  adaptiveSheetRoot,
  adaptiveSheetScroll,
  adaptiveSheetScrollContent,
  adaptiveSheetTitle,
} from '@/lib/adaptiveSheetBodyStyles';
import {
  webHover,
  webListRowHoverStyles,
  webPointer,
  webTextLinkHoverStyles,
} from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

export type NotificationsFeedBodyProps = {
  visible: boolean;
  onClose: () => void;
  variant?: 'sheet' | 'dialog';
  style?: StyleProp<ViewStyle>;
  scrollStyle?: StyleProp<ViewStyle>;
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

export function NotificationsFeedBody({
  visible,
  onClose,
  variant = 'sheet',
  style,
  scrollStyle,
}: NotificationsFeedBodyProps) {
  const { colors } = useTheme();
  const { notifications, unreadCount, isReady, markRead, markAllRead, refreshNotifications } =
    useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const isDialog = variant === 'dialog';

  const isDialogEmpty = isDialog && isReady && notifications.length === 0;
  const isDialogLoading = isDialog && !isReady;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    root: {
      gap: spacing.sm,
      ...adaptiveSheetRoot(isDialog),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: isDialog ? 0 : spacing.lg,
      paddingTop: isDialog ? 0 : spacing.sm,
      paddingBottom: spacing.md,
      ...adaptiveSheetHeader(isDialog, colors),
    },
    headerTitle: adaptiveSheetTitle(isDialog, colors, {
      fontSize: 20,
      fontWeight: '700',
      letterSpacing: -0.4,
      color: colors.labelPrimary,
      flex: isDialog ? 1 : undefined,
    }),
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
      paddingHorizontal: isDialog ? 0 : spacing.lg,
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
      marginHorizontal: isDialog ? 0 : spacing.lg,
      marginBottom: spacing.md,
      width: isDialog ? ('100%' as const) : undefined,
      backgroundColor: colors.surface,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: isDialog ? StyleSheet.hairlineWidth : 0,
      borderColor: colors.separator,
      ...(Platform.OS === 'ios' && !isDialog
        ? {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 4,
          }
        : Platform.OS === 'android' && !isDialog
          ? { elevation: 1 }
          : {}),
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
      marginLeft: 76,
    },
    empty: {
      marginHorizontal: isDialog ? 0 : spacing.lg,
      marginBottom: isDialog ? 0 : spacing.md,
      width: isDialog ? ('100%' as const) : undefined,
      paddingVertical: isDialog ? spacing.xl : spacing.xl * 1.5,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: isDialog ? 'transparent' : colors.surface,
      borderRadius: isDialog ? 0 : 12,
      borderWidth: isDialog ? 0 : StyleSheet.hairlineWidth,
      borderColor: colors.separator,
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
      width: isDialog ? ('100%' as const) : undefined,
    },
    scrollBottom: {
      height: spacing.md,
    },
    scroll: adaptiveSheetScroll(isDialog, 560),
    scrollContentDialog: adaptiveSheetScrollContent(isDialog),
    dialogEmptyBody: {
      ...adaptiveSheetCenteredBody(isDialog, 320),
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
    },
    dialogLoadingBody: {
      ...adaptiveSheetCenteredBody(isDialog, 240),
      paddingVertical: spacing.xl,
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
    <View style={[styles.root, style]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {!isDialog ? (
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
        ) : null}
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

      {isDialogLoading ? (
        <View style={styles.dialogLoadingBody}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : isDialogEmpty ? (
        <View style={styles.dialogEmptyBody}>
          <View style={styles.emptyIcon}>
            <Ionicons name="notifications-outline" size={28} color={colors.labelSecondary} />
          </View>
          <Text style={styles.emptyTitle}>You&apos;re all caught up</Text>
          <Text style={styles.emptyText}>
            When clinics or workers interact with your posts and applications, updates will show up
            here.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={[styles.scroll, scrollStyle]}
          contentContainerStyle={isDialog ? styles.scrollContentDialog : undefined}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={isDialog}
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
                When clinics or workers interact with your posts and applications, updates will show
                up here.
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
          {!isDialog ? <View style={styles.scrollBottom} /> : null}
        </ScrollView>
      )}
    </View>
  );
}
