import type { ClinicPlan } from '@chairside/config';

import type { BillingOfferings, BillingPackage } from '@/lib/billingOfferings';

/**
 * Fallback implementation for tooling and non-platform runtimes.
 * Metro resolves `revenueCat.native.ts` and `revenueCat.web.ts` at build time.
 */
export async function configureRevenueCat(_appUserId: string): Promise<void> {}

export async function logOutRevenueCat(): Promise<void> {}

export async function getBillingOfferings(): Promise<BillingOfferings | null> {
  return null;
}

export async function purchaseBillingPackage(_billingPackage: BillingPackage): Promise<ClinicPlan> {
  return 'free';
}

export async function restoreRevenueCatPurchases(): Promise<ClinicPlan> {
  return 'free';
}

export async function getCurrentClinicPlan(): Promise<ClinicPlan | null> {
  return null;
}

export async function openSubscriptionManagement(): Promise<boolean> {
  return false;
}
