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
};

export function NotificationBell({
  placement = 'header',
  embedded = false,
}: NotificationBellProps) {
  const { colors, isDark } = useTheme();
  const clientId = getPingramClientId();
  const { unreadCount, isReady } = useNotifications();
  const [open, setOpen] = useState(false);
  const inHero = placement === 'hero';

  const styles = useThemedStyles(({ colors, spacing }) => ({
    button: {
      width: 40,
      height: 40,
      borderRadius: 20,
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
    badge: {
      position: 'absolute',
      top: 2,
      right: 2,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.destructive,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 5,
      borderWidth: 2,
      borderColor: embedded ? colors.surface : colors.backgroundGrouped,
    },
    badgeText: {
      color: colors.primaryOnPrimary,
      fontSize: 11,
      fontWeight: '700',
    },
  }));

  if (!clientId) return null;

  return (
    <>
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
          size={22}
          color={colors.labelPrimary}
        />
        {unreadCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
          </View>
        ) : null}
      </Pressable>
      <NotificationsFeedModal visible={open} onClose={() => setOpen(false)} />
    </>
  );
}
