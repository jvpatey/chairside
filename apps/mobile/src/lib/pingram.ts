import Constants from 'expo-constants';

/**
 * Pingram's front-end SDK uses the environment client ID in API paths and Basic auth,
 * not the full `pingram_pk_...` public key. If the env var is a public key JWT, we
 * extract `environmentId` from its payload.
 */
function resolvePingramEnvironmentClientId(value: string): string {
  if (!value.startsWith('pingram_pk_')) return value;
  try {
    const payload = value.split('.')[1];
    if (!payload) return value;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const parsed = JSON.parse(atob(padded)) as { environmentId?: string };
    return parsed.environmentId?.trim() || value;
  } catch {
    return value;
  }
}

export function getPingramClientId(): string | undefined {
  const explicitEnvId = process.env.EXPO_PUBLIC_PINGRAM_ENVIRONMENT_ID?.trim();
  if (explicitEnvId) return explicitEnvId;

  const fromEnv = process.env.EXPO_PUBLIC_PINGRAM_CLIENT_ID?.trim();
  if (fromEnv) return resolvePingramEnvironmentClientId(fromEnv);

  const extra = Constants.expoConfig?.extra as
    | { pingramClientId?: string; pingramEnvironmentId?: string }
    | undefined;
  if (extra?.pingramEnvironmentId?.trim()) return extra.pingramEnvironmentId.trim();
  if (extra?.pingramClientId?.trim()) {
    return resolvePingramEnvironmentClientId(extra.pingramClientId.trim());
  }
  return undefined;
}

export function getPingramApiHost(): string {
  return process.env.EXPO_PUBLIC_PINGRAM_API_HOST?.trim() || 'api.ca.pingram.io';
}

export function getPingramApiBaseUrl(): string {
  const host = getPingramApiHost();
  return host.startsWith('https://') ? host : `https://${host}`;
}

export function getPingramWsHost(): string {
  return process.env.EXPO_PUBLIC_PINGRAM_WS_HOST?.trim() || 'ws.ca.pingram.io';
}

/** Map chairside:// deep links from notifications to Expo Router paths. */
export function resolveNotificationDeepLink(url: string | undefined | null): string | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('/')) return trimmed;
  if (trimmed.startsWith('chairside://')) {
    const path = trimmed.replace(/^chairside:\/\//, '');
    return path.startsWith('/') ? path : `/${path}`;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'chairside:') {
      const path = `/${parsed.host}${parsed.pathname}`.replace(/\/+/g, '/');
      return path === '/' ? null : path;
    }
  } catch {
    return null;
  }
  return null;
}
