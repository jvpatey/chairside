import {
  getSupabaseClient,
  listUserNotifications,
  markAllUserNotificationsRead,
  markUserNotificationsRead,
  type UserNotification,
} from '@chairside/api';
import { router } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useRefreshOnForeground } from '@/hooks/useRefreshOnForeground';
import { navigateToNotificationDeepLink, resolveNotificationDeepLink } from '@/lib/notificationRouting';

/** App-facing in-app notification shape (Supabase-backed; not Pingram). */
export type InAppNotification = {
  id: string;
  title: string;
  body: string | null;
  seen: boolean;
  date: string;
  notificationId: string;
  redirectURL: string | null;
};

type NotificationContextValue = {
  notifications: InAppNotification[];
  unreadCount: number;
  isReady: boolean;
  refreshNotifications: () => Promise<void>;
  markAllRead: () => Promise<void>;
  markRead: (ids: string[]) => Promise<void>;
  markReadByDeepLink: (deepLink: string) => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

function toInAppNotification(row: UserNotification): InAppNotification {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    seen: Boolean(row.seen_at),
    date: row.created_at,
    notificationId: row.type,
    redirectURL: row.deep_link,
  };
}

function sortNotifications(items: InAppNotification[]): InAppNotification[] {
  return [...items].sort((a, b) => {
    const aTime = new Date(a.date ?? 0).getTime();
    const bTime = new Date(b.date ?? 0).getTime();
    return bTime - aTime;
  });
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [isReady, setIsReady] = useState(false);
  const userIdRef = useRef<string | null>(null);
  userIdRef.current = user?.id ?? null;

  const refreshNotifications = useCallback(async () => {
    const userId = userIdRef.current;
    if (!userId) return;
    try {
      const rows = await listUserNotifications(userId, { limit: 50 });
      setNotifications(sortNotifications(rows.map(toInAppNotification)));
    } catch (error) {
      console.warn('Could not load in-app notifications', error);
    }
  }, []);

  const refreshOnForeground = useCallback(async () => {
    await refreshNotifications();
  }, [refreshNotifications]);

  useRefreshOnForeground(refreshOnForeground);

  useEffect(() => {
    if (!user?.id || !isReady) return;

    const pollIntervalMs = 25_000;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (intervalId) return;
      intervalId = setInterval(() => {
        void refreshNotifications();
      }, pollIntervalMs);
    };

    const stopPolling = () => {
      if (!intervalId) return;
      clearInterval(intervalId);
      intervalId = null;
    };

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        startPolling();
      } else {
        stopPolling();
      }
    };

    if (AppState.currentState === 'active') {
      startPolling();
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
      stopPolling();
    };
  }, [isReady, refreshNotifications, user?.id]);

  const markRead = useCallback(async (ids: string[]) => {
    const userId = userIdRef.current;
    if (!userId || ids.length === 0) return;
    try {
      await markUserNotificationsRead(userId, ids);
      setNotifications((prev) =>
        prev.map((n) => (ids.includes(n.id) ? { ...n, seen: true } : n)),
      );
    } catch (error) {
      console.warn('Could not mark notifications read', error);
    }
  }, []);

  const markReadByDeepLink = useCallback(
    async (deepLink: string) => {
      const userId = userIdRef.current;
      if (!userId) return;

      const resolvedPath = resolveNotificationDeepLink(deepLink) ?? deepLink;
      const normalizedPath = resolvedPath.startsWith('/') ? resolvedPath : `/${resolvedPath}`;
      const chairsideUrl = `chairside://${normalizedPath.replace(/^\//, '')}`;

      const findMatchingIds = (items: InAppNotification[]) =>
        items
          .filter((notification) => {
            if (notification.seen) return false;
            const redirect = notification.redirectURL ?? '';
            if (!redirect) return false;
            const resolvedRedirect = resolveNotificationDeepLink(redirect) ?? redirect;
            return (
              redirect === chairsideUrl ||
              redirect === normalizedPath ||
              resolvedRedirect === normalizedPath
            );
          })
          .map((notification) => notification.id);

      let matchingIds = findMatchingIds(notifications);
      if (matchingIds.length === 0) {
        try {
          const rows = await listUserNotifications(userId, { limit: 50 });
          const items = sortNotifications(rows.map(toInAppNotification));
          setNotifications(items);
          matchingIds = findMatchingIds(items);
        } catch (error) {
          console.warn('Could not refresh notifications for push read state', error);
        }
      }

      if (matchingIds.length > 0) {
        await markRead(matchingIds);
      }
    },
    [markRead, notifications],
  );

  const markAllRead = useCallback(async () => {
    const userId = userIdRef.current;
    if (!userId) return;
    try {
      await markAllUserNotificationsRead(userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, seen: true })));
    } catch (error) {
      console.warn('Could not mark all notifications read', error);
    }
  }, []);

  useEffect(() => {
    const userId = user?.id;

    if (!userId) {
      setIsReady(false);
      setNotifications([]);
      return;
    }

    let cancelled = false;
    let channel: ReturnType<ReturnType<typeof getSupabaseClient>['channel']> | null = null;

    async function setup() {
      try {
        await refreshNotifications();
        if (!cancelled) setIsReady(true);

        const supabase = getSupabaseClient();
        channel = supabase
          .channel(`user_notifications:${userId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_notifications',
              filter: `user_id=eq.${userId}`,
            },
            () => {
              if (!cancelled) void refreshNotifications();
            },
          )
          .subscribe();
      } catch (error) {
        console.warn('Notification provider setup failed', error);
        if (!cancelled) setIsReady(false);
      }
    }

    void setup();

    return () => {
      cancelled = true;
      setIsReady(false);
      if (channel) {
        void getSupabaseClient().removeChannel(channel);
      }
    };
  }, [user?.id, refreshNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.seen).length,
    [notifications],
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isReady,
      refreshNotifications,
      markAllRead,
      markRead,
      markReadByDeepLink,
    }),
    [notifications, unreadCount, isReady, refreshNotifications, markAllRead, markRead, markReadByDeepLink],
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return ctx;
}

export function openNotificationTarget(notification: InAppNotification) {
  navigateToNotificationDeepLink(router, notification.redirectURL);
}
