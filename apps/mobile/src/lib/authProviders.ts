import type { User } from '@supabase/supabase-js';

/** True when the user can sign in with email + password (not OAuth-only). */
export function userHasEmailPasswordLogin(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.identities?.some((identity) => identity.provider === 'email') ?? false;
}
