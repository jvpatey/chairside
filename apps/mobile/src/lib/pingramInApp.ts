import type { InAppNotification } from '@notificationapi/core/dist/interfaces';

type PingramNotificationsResponse = {
  notifications?: InAppNotification[];
  items?: InAppNotification[];
  message?: string;
};

/** Normalize Pingram list responses; the core SDK crashes if `notifications` is missing. */
export function parseInAppNotificationsResponse(
  raw: PingramNotificationsResponse | null | undefined,
): InAppNotification[] {
  if (Array.isArray(raw?.notifications)) return raw.notifications;
  if (Array.isArray(raw?.items)) return raw.items;
  return [];
}

export async function fetchInAppNotifications(
  client: {
    rest: {
      getNotifications: (before: string, count: number) => Promise<PingramNotificationsResponse>;
    };
  },
  options?: { before?: string; maxCount?: number },
): Promise<InAppNotification[]> {
  const before = options?.before ?? new Date().toISOString();
  const count = options?.maxCount ?? 50;
  const raw = await client.rest.getNotifications(before, count);
  if (raw?.message && !raw.notifications?.length && !raw.items?.length) {
    throw new Error(raw.message);
  }
  return parseInAppNotificationsResponse(raw);
}
