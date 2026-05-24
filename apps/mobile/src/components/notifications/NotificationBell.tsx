import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { NotificationsFeedModal } from '@/components/notifications/NotificationsFeedModal';
import { useNotifications } from '@/contexts/NotificationContext';
import { getPingramClientId } from '@/lib/pingram';
import { useTheme, useThemedStyles } from '@/theme';

export function NotificationBell() {
  const { colors } = useTheme();
  const clientId = getPingramClientId();
  const { unreadCount, isReady } = useNotifications();
  const [open, setOpen] = useState(false);

  const styles = useThemedStyles(({ spacing }) => ({
    button: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    badge: {
      position: 'absolute',
      top: 4,
      right: 4,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.destructive,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    badgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '700',
    },
  }));

  if (!clientId) return null;

  return (
    <>
      <Pressable
        style={styles.button}
        accessibilityLabel="Notifications"
        onPress={() => setOpen(true)}
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
