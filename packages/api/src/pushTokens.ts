import { getSupabaseClient } from './client';
import type { UserPushTokenRow } from './types';

export type UserPushToken = UserPushTokenRow;

export type PushTokenPlatform = UserPushTokenRow['platform'];

export async function upsertUserPushToken(
  userId: string,
  expoPushToken: string,
  platform: PushTokenPlatform,
): Promise<UserPushToken> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc('upsert_user_push_token', {
    p_expo_push_token: expoPushToken,
    p_platform: platform,
  });

  if (error) throw error;
  if (!data) {
    throw new Error('upsert_user_push_token returned no row');
  }

  // RPC is auth-scoped; userId is retained for call-site clarity / future checks.
  if (data.user_id !== userId) {
    throw new Error('Push token was saved for a different user than expected');
  }

  return data;
}

/** Clears all Expo push tokens for the user (e.g. on sign-out). */
export async function deleteUserPushTokens(userId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('user_push_tokens').delete().eq('user_id', userId);
  if (error) throw error;
}
