import {
  REVENUECAT_ENTITLEMENT_PRO,
  REVENUECAT_ENTITLEMENT_STARTER,
  type ClinicPlan,
} from '@chairside/config';
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOfferings,
  type PurchasesPackage,
} from 'react-native-purchases';

import { getRevenueCatApiKey, isRevenueCatConfigured } from '@/lib/revenueCatEnv';

let configuredForUserId: string | null = null;

export async function configureRevenueCat(appUserId: string): Promise<void> {
  if (!isRevenueCatConfigured()) return;

  const apiKey = getRevenueCatApiKey();
  if (!apiKey) return;

  if (configuredForUserId === appUserId) return;

  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);
  await Purchases.configure({ apiKey, appUserID: appUserId });
  configuredForUserId = appUserId;
}

export async function logOutRevenueCat(): Promise<void> {
  if (!isRevenueCatConfigured()) return;
  if (!configuredForUserId) return;

  await Purchases.logOut();
  configuredForUserId = null;
}

export async function getRevenueCatOfferings(): Promise<PurchasesOfferings | null> {
  if (!isRevenueCatConfigured()) return null;
  return Purchases.getOfferings();
}

export async function purchaseRevenueCatPackage(
  purchasePackage: PurchasesPackage,
): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.purchasePackage(purchasePackage);
  return customerInfo;
}

export async function restoreRevenueCatPurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}

export function getClinicPlanFromCustomerInfo(customerInfo: CustomerInfo): ClinicPlan {
  const active = customerInfo.entitlements.active;
  if (active[REVENUECAT_ENTITLEMENT_PRO]) return 'pro';
  if (active[REVENUECAT_ENTITLEMENT_STARTER]) return 'starter';
  return 'free';
}

export async function getRevenueCatCustomerInfo(): Promise<CustomerInfo | null> {
  if (!isRevenueCatConfigured()) return null;
  return Purchases.getCustomerInfo();
}
