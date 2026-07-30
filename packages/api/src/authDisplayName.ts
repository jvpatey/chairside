export type AppleNameParts = {
  givenName?: string | null;
  middleName?: string | null;
  familyName?: string | null;
};

/** Build a display name from Apple AuthenticationServices fullName parts. */
export function formatAppleFullName(fullName: AppleNameParts | null | undefined): string {
  if (!fullName) return '';
  return [fullName.givenName, fullName.middleName, fullName.familyName]
    .filter((part): part is string => Boolean(part && String(part).trim()))
    .join(' ')
    .trim();
}

/** Read a display name from Supabase auth user_metadata. */
export function getUserMetadataDisplayName(
  userMetadata: Record<string, unknown> | null | undefined,
): string {
  if (!userMetadata) return '';

  for (const key of ['full_name', 'name'] as const) {
    const value = userMetadata[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

/**
 * Prefer an existing profile display name, then auth metadata (Apple/Google).
 * Used to prefill setup without re-asking for identity Apple already provided.
 */
export function resolveAuthDisplayName(
  profileDisplayName?: string | null,
  userMetadata?: Record<string, unknown> | null,
): string {
  const fromProfile = profileDisplayName?.trim();
  if (fromProfile) return fromProfile;
  return getUserMetadataDisplayName(userMetadata);
}

/**
 * Name to persist after Sign in with Apple: credential name first,
 * then previously stored metadata (Apple only sends name on first authorization).
 */
export function resolveAppleNameToPersist(
  appleFullName: AppleNameParts | null | undefined,
  userMetadata?: Record<string, unknown> | null,
): string {
  return formatAppleFullName(appleFullName) || getUserMetadataDisplayName(userMetadata);
}
