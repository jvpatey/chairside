import { getSupabaseClient } from './client';
import type { UserNotificationRow } from './types';

export type UserNotification = UserNotificationRow;

export async function listUserNotifications(
  userId: string,
  options?: { limit?: number },
): Promise<UserNotification[]> {
  const supabase = getSupabaseClient();
  const limit = options?.limit ?? 50;

  // Prefer RLS (auth.uid()) as source of truth; userId filter is a belt-and-suspenders
  // guard for the authenticated session.
  const { data, error } = await supabase
    .from('user_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as UserNotification[];
}

export async function markUserNotificationsRead(
  userId: string,
  ids: string[],
): Promise<void> {
  if (ids.length === 0) return;

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('user_notifications')
    .update({ seen_at: new Date().toISOString() })
    .eq('user_id', userId)
    .in('id', ids)
    .is('seen_at', null);

  if (error) throw error;
}

export async function markAllUserNotificationsRead(userId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('user_notifications')
    .update({ seen_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('seen_at', null);

  if (error) throw error;
}
