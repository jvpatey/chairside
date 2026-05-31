import type { NotificationPreferenceCategory } from '@chairside/config';
import {
  listNotificationPreferences,
  resolvePushEnabled,
  upsertNotificationPreference,
} from '@chairside/api';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';

export function useNotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<
    Awaited<ReturnType<typeof listNotificationPreferences>>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingCategory, setSavingCategory] = useState<NotificationPreferenceCategory | null>(
    null,
  );

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setPreferences([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const rows = await listNotificationPreferences(user.id);
      setPreferences(rows);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isPushEnabled = useCallback(
    (category: NotificationPreferenceCategory) => resolvePushEnabled(preferences, category),
    [preferences],
  );

  const setPushEnabled = useCallback(
    async (category: NotificationPreferenceCategory, pushEnabled: boolean) => {
      if (!user?.id) return;

      setSavingCategory(category);
      setPreferences((prev) => {
        const existing = prev.find((row) => row.category === category);
        if (existing) {
          return prev.map((row) =>
            row.category === category ? { ...row, push_enabled: pushEnabled } : row,
          );
        }
        return [
          ...prev,
          {
            user_id: user.id,
            category,
            push_enabled: pushEnabled,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
      });

      try {
        const saved = await upsertNotificationPreference(user.id, category, {
          push_enabled: pushEnabled,
        });
        setPreferences((prev) => {
          const without = prev.filter((row) => row.category !== category);
          return [...without, saved];
        });
      } catch (error) {
        await refresh();
        throw error;
      } finally {
        setSavingCategory(null);
      }
    },
    [refresh, user?.id],
  );

  return {
    preferences,
    isLoading,
    savingCategory,
    isPushEnabled,
    setPushEnabled,
    refresh,
  };
}
