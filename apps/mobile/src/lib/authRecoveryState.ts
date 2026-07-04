import { getAuthStorage } from '@chairside/api';

const RECOVERY_PENDING_KEY = 'chairside:auth:recovery-pending';
const RECOVERY_PENDING_VALUE = '1';

export async function markPasswordRecoveryPending(): Promise<void> {
  await getAuthStorage().setItem(RECOVERY_PENDING_KEY, RECOVERY_PENDING_VALUE);
}

export async function clearPasswordRecoveryPending(): Promise<void> {
  await getAuthStorage().removeItem(RECOVERY_PENDING_KEY);
}

export async function isPasswordRecoveryPending(): Promise<boolean> {
  const value = await getAuthStorage().getItem(RECOVERY_PENDING_KEY);
  return value === RECOVERY_PENDING_VALUE;
}
