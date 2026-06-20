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

type PingramInAppClient = {
  getInAppNotifications?: (params: {
    before?: string;
    maxCountNeeded?: number;
  }) => Promise<{ items?: InAppNotification[] }>;
  rest: {
    getNotifications: (before: string, count: number) => Promise<PingramNotificationsResponse>;
  };
};

export async function fetchInAppNotifications(
  client: PingramInAppClient,
  options?: { before?: string; maxCount?: number },
): Promise<InAppNotification[]> {
  const count = options?.maxCount ?? 50;
  // Slight future buffer avoids missing just-created items when client clock lags Pingram.
  const before =
    options?.before ?? new Date(Date.now() + 60_000).toISOString();

  if (client.getInAppNotifications) {
    const result = await client.getInAppNotifications({ before, maxCountNeeded: count });
    return result.items ?? [];
  }

  const raw = await client.rest.getNotifications(before, count);
  if (raw?.message && !raw.notifications?.length && !raw.items?.length) {
    throw new Error(raw.message);
  }
  return parseInAppNotificationsResponse(raw);
}
