import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { NotificationsFeedModal } from '@/components/notifications/NotificationsFeedModal';
import { useNotifications } from '@/contexts/NotificationContext';
import { getPingramClientId } from '@/lib/pingram';
import {
  webHover,
  webIconButtonHoverStyles,
  webPointer,
} from '@/lib/webPressableStyles';
import { colorWithAlpha, useTheme, useThemedStyles } from '@/theme';

type NotificationBellProps = {
  /** `hero` — top-right inside dashboard hero card; `header` — screen title row */
  placement?: 'header' | 'hero';
  /** Transparent button when nested inside a glass hero cluster */
  embedded?: boolean;
  size?: number;
};

export function NotificationBell({
  placement = 'header',
  embedded = false,
  size = 40,
}: NotificationBellProps) {
  const { colors, isDark } = useTheme();
  const clientId = getPingramClientId();
  const { unreadCount, isReady } = useNotifications();
  const [open, setOpen] = useState(false);
  const inHero = placement === 'hero';
  const isCompact = size <= 32;
  const isSmall = size <= 28;

  const iconSize = Math.round(size * (isCompact ? 0.52 : 0.55));
  /** Tiny hero buttons can't fit a count pill inside the clipped glass cluster. */
  const useDotBadge = isSmall && embedded;

  const styles = useThemedStyles(({ colors, spacing }) => ({
    hitArea: {
      width: size,
      height: size,
      alignItems: 'center',
      justifyContent: 'center',
    },
    button: {
      width: size,
      height: size,
      borderRadius: size / 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: inHero ? 0 : spacing.sm,
      backgroundColor:
        embedded && inHero
          ? colorWithAlpha(colors.surface, isDark ? 0.42 : 0.78)
          : embedded
            ? 'transparent'
            : colors.fillSubtle,
      ...webPointer(),
    },
    buttonHovered: webIconButtonHoverStyles(colors),
    buttonPressed: {
      backgroundColor: colors.separator,
      opacity: 0.9,
    },
    dotBadge: {
      position: 'absolute',
      top: isCompact ? 3 : 4,
      right: isCompact ? 3 : 4,
      width: isCompact ? 8 : 10,
      height: isCompact ? 8 : 10,
      borderRadius: isCompact ? 4 : 5,
      backgroundColor: colors.destructive,
      borderWidth: 1.5,
      borderColor: embedded ? colors.surface : colors.backgroundGrouped,
    },
    countBadge: {
      position: 'absolute',
      top: isCompact ? 1 : 2,
      right: isCompact ? 1 : 2,
      minWidth: isCompact ? 15 : 18,
      height: isCompact ? 15 : 18,
      borderRadius: isCompact ? 8 : 9,
      backgroundColor: colors.destructive,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: isCompact ? 3 : 5,
      borderWidth: isCompact ? 1.5 : 2,
      borderColor: embedded ? colors.surface : colors.backgroundGrouped,
    },
    badgeText: {
      color: colors.primaryOnPrimary,
      fontSize: isCompact ? 9 : 11,
      fontWeight: '700',
      lineHeight: isCompact ? 11 : 13,
    },
  }));

  if (!clientId) return null;

  return (
    <>
      <View style={styles.hitArea}>
        <Pressable
          style={({ pressed, hovered }) => [
            styles.button,
            webHover(hovered, pressed, styles.buttonHovered, !isReady),
            pressed && styles.buttonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'
          }
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setOpen(true);
          }}
          disabled={!isReady}>
          <Ionicons
            name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
            size={iconSize}
            color={colors.labelPrimary}
          />
          {unreadCount > 0 ? (
            useDotBadge ? (
              <View style={styles.dotBadge} accessibilityElementsHidden importantForAccessibility="no" />
            ) : (
              <View style={styles.countBadge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )
          ) : null}
        </Pressable>
      </View>
      <NotificationsFeedModal visible={open} onClose={() => setOpen(false)} />
    </>
  );
}
