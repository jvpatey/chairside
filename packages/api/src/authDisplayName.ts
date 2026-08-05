export type AppleNameParts = {
  givenName?: string | null;
  middleName?: string | null;
  familyName?: string | null;
};

export type PersonNameParts = {
  firstName: string;
  lastName: string;
};

/** Build a display name from Apple AuthenticationServices fullName parts. */
export function formatAppleFullName(fullName: AppleNameParts | null | undefined): string {
  if (!fullName) return '';
  return [fullName.givenName, fullName.middleName, fullName.familyName]
    .filter((part): part is string => Boolean(part && String(part).trim()))
    .join(' ')
    .trim();
}

/** Join first + last into profiles.display_name. */
export function joinDisplayName(firstName?: string | null, lastName?: string | null): string {
  return [firstName, lastName]
    .map((part) => part?.trim() ?? '')
    .filter(Boolean)
    .join(' ');
}

/**
 * Split a single display name into first/last.
 * First token → firstName; remainder → lastName.
 */
export function splitDisplayName(displayName?: string | null): PersonNameParts {
  const trimmed = displayName?.trim() ?? '';
  if (!trimmed) {
    return { firstName: '', lastName: '' };
  }

  const spaceIndex = trimmed.indexOf(' ');
  if (spaceIndex === -1) {
    return { firstName: trimmed, lastName: '' };
  }

  return {
    firstName: trimmed.slice(0, spaceIndex).trim(),
    lastName: trimmed.slice(spaceIndex + 1).trim(),
  };
}

function trimPart(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
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

/** Read first/last from auth metadata (Apple given/family or split full_name). */
export function getUserMetadataNameParts(
  userMetadata: Record<string, unknown> | null | undefined,
): PersonNameParts {
  if (!userMetadata) {
    return { firstName: '', lastName: '' };
  }

  const given = trimPart(userMetadata.given_name);
  const family = trimPart(userMetadata.family_name);
  if (given || family) {
    return { firstName: given, lastName: family };
  }

  return splitDisplayName(getUserMetadataDisplayName(userMetadata));
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
 * Resolve personal first/last for setup prefill.
 * Order: profile first/last → split profile display_name → metadata given/family → split metadata name.
 */
export function resolveAuthNameParts(input: {
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  userMetadata?: Record<string, unknown> | null;
}): PersonNameParts {
  const fromProfileFirst = input.firstName?.trim() ?? '';
  const fromProfileLast = input.lastName?.trim() ?? '';
  if (fromProfileFirst || fromProfileLast) {
    return { firstName: fromProfileFirst, lastName: fromProfileLast };
  }

  const fromDisplay = splitDisplayName(input.displayName);
  if (fromDisplay.firstName || fromDisplay.lastName) {
    return fromDisplay;
  }

  return getUserMetadataNameParts(input.userMetadata);
}

export function applePartsToPersonName(fullName: AppleNameParts | null | undefined): PersonNameParts {
  if (!fullName) {
    return { firstName: '', lastName: '' };
  }

  const firstName = [fullName.givenName, fullName.middleName]
    .map((part) => part?.trim() ?? '')
    .filter(Boolean)
    .join(' ');
  const lastName = fullName.familyName?.trim() ?? '';
  return { firstName, lastName };
}

/**
 * Name parts to persist after Sign in with Apple.
 * Order: Apple credential → device cache → previously stored metadata.
 */
export function resolveAppleNamePartsToPersist(input: {
  appleFullName?: AppleNameParts | null;
  cachedName?: AppleNameParts | PersonNameParts | null;
  userMetadata?: Record<string, unknown> | null;
}): PersonNameParts {
  const fromApple = applePartsToPersonName(input.appleFullName);
  if (fromApple.firstName || fromApple.lastName) {
    return fromApple;
  }

  if (input.cachedName) {
    if ('givenName' in input.cachedName || 'familyName' in input.cachedName) {
      const fromCache = applePartsToPersonName(input.cachedName as AppleNameParts);
      if (fromCache.firstName || fromCache.lastName) {
        return fromCache;
      }
    } else {
      const cached = input.cachedName as PersonNameParts;
      const firstName = cached.firstName?.trim() ?? '';
      const lastName = cached.lastName?.trim() ?? '';
      if (firstName || lastName) {
        return { firstName, lastName };
      }
    }
  }

  return getUserMetadataNameParts(input.userMetadata);
}

/**
 * Name to persist after Sign in with Apple: credential name first,
 * then previously stored metadata (Apple only sends name on first authorization).
 */
export function resolveAppleNameToPersist(
  appleFullName: AppleNameParts | null | undefined,
  userMetadata?: Record<string, unknown> | null,
  cachedName?: AppleNameParts | PersonNameParts | null,
): string {
  const parts = resolveAppleNamePartsToPersist({
    appleFullName,
    cachedName,
    userMetadata,
  });
  return joinDisplayName(parts.firstName, parts.lastName);
}
