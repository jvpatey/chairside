import type { NotificationPreferenceCategory } from '@chairside/config';

import { getSupabaseClient } from './client';
import type { Database, NotificationPreferenceRow } from './types';

export type NotificationPreference = NotificationPreferenceRow;

export type NotificationPreferenceUpdate = {
  push_enabled: boolean;
};

/** Default push preference when no row exists — matches DB default. */
export function isPushEnabledByDefault(_category: NotificationPreferenceCategory): boolean {
  return true;
}

export async function listNotificationPreferences(
  userId: string,
): Promise<NotificationPreference[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data ?? [];
}

export async function getNotificationPreference(
  userId: string,
  category: NotificationPreferenceCategory,
): Promise<NotificationPreference | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .eq('category', category)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export function resolvePushEnabled(
  preferences: NotificationPreference[],
  category: NotificationPreferenceCategory,
): boolean {
  const row = preferences.find((pref) => pref.category === category);
  return row?.push_enabled ?? isPushEnabledByDefault(category);
}

export async function upsertNotificationPreference(
  userId: string,
  category: NotificationPreferenceCategory,
  update: NotificationPreferenceUpdate,
): Promise<NotificationPreference> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  const payload: Database['public']['Tables']['notification_preferences']['Insert'] = {
    user_id: userId,
    category,
    push_enabled: update.push_enabled,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert(payload, { onConflict: 'user_id,category' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export type { NotificationPreferenceCategory };
