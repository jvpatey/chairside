import { NotificationAPIClientSDK } from '@notificationapi/core';
import type { InAppNotification } from '@notificationapi/core/dist/interfaces';
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

import { useAuth } from '@/contexts/AuthContext';
import {
  getPingramApiHost,
  getPingramClientId,
  getPingramWsHost,
  resolveNotificationDeepLink,
} from '@/lib/pingram';
import { fetchInAppNotifications } from '@/lib/pingramInApp';

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
  const clientRef = useRef<ReturnType<typeof NotificationAPIClientSDK.init> | null>(null);

  const refreshNotifications = useCallback(async () => {
    const client = clientRef.current;
    if (!client) return;
    try {
      const items = await fetchInAppNotifications(client, { maxCount: 50 });
      setNotifications(sortNotifications(items));
    } catch (error) {
      console.warn('Could not load in-app notifications', error);
    }
  }, []);

  const markRead = useCallback(async (ids: string[]) => {
    const client = clientRef.current;
    if (!client || ids.length === 0) return;
    try {
      await client.updateInAppNotifications({ ids, opened: true });
      setNotifications((prev) =>
        prev.map((n) => (ids.includes(n.id) ? { ...n, seen: true } : n)),
      );
    } catch (error) {
      console.warn('Could not mark notifications read', error);
    }
  }, []);

  const markReadByDeepLink = useCallback(
    async (deepLink: string) => {
      const client = clientRef.current;
      if (!client) return;

      const resolvedPath = resolveNotificationDeepLink(deepLink) ?? deepLink;
      const normalizedPath = resolvedPath.startsWith('/') ? resolvedPath : `/${resolvedPath}`;
      const chairsideUrl = `chairside://${normalizedPath.replace(/^\//, '')}`;

      const findMatchingIds = (items: InAppNotification[]) =>
        items
          .filter((notification) => {
            if (notification.seen) return false;
            const redirect =
              notification.redirectURL ?? notification.template?.instant?.redirectURL ?? '';
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
          const items = await fetchInAppNotifications(client, { maxCount: 50 });
          setNotifications(sortNotifications(items));
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
    const unreadIds = notifications.filter((n) => !n.seen).map((n) => n.id);
    await markRead(unreadIds);
  }, [markRead, notifications]);

  useEffect(() => {
    const clientId = getPingramClientId();
    const userId = user?.id;

    if (!clientId || !userId) {
      clientRef.current = null;
      setIsReady(false);
      setNotifications([]);
      return;
    }

    let cancelled = false;

    async function setup() {
      if (!clientId || !userId) return;
      try {
        const client = NotificationAPIClientSDK.init({
          clientId,
          userId,
          host: getPingramApiHost(),
          websocketHost: getPingramWsHost(),
          onNewInAppNotifications: (incoming) => {
            if (cancelled) return;
            const list = Array.isArray(incoming) ? incoming : [];
            if (list.length === 0) return;
            setNotifications((prev) => {
              const byId = new Map(prev.map((n) => [n.id, n]));
              for (const item of list) {
                byId.set(item.id, item);
              }
              return sortNotifications([...byId.values()]);
            });
          },
        });

        clientRef.current = client;
        client.openWebSocket();
        await client.identify({ id: userId });
        await refreshNotifications();

        if (!cancelled) setIsReady(true);
      } catch (error) {
        console.warn('Notification provider setup failed', error);
        if (!cancelled) {
          setIsReady(false);
        }
      }
    }

    void setup();

    return () => {
      cancelled = true;
      clientRef.current?.websocket.disconnect();
      clientRef.current = null;
      setIsReady(false);
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
  const path = resolveNotificationDeepLink(
    notification.redirectURL ?? notification.template?.instant?.redirectURL,
  );
  if (path) {
    router.push(path as never);
  }
}
