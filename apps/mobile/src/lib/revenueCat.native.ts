import type { ClinicPlan } from '@chairside/config';
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesPackage,
} from 'react-native-purchases';

import {
  getClinicPlanFromEntitlements,
  resolveBillingPackageMeta,
  type BillingOfferings,
  type BillingPackage,
} from '@/lib/billingOfferings';
import { getRevenueCatApiKey, isRevenueCatConfigured } from '@/lib/revenueCatEnv';

let configuredForUserId: string | null = null;

function mapNativePackage(pkg: PurchasesPackage): BillingPackage | null {
  const meta = resolveBillingPackageMeta([pkg.identifier, pkg.product.identifier]);
  if (!meta) return null;

  return {
    identifier: pkg.identifier,
    productIdentifier: pkg.product.identifier,
    priceLabel: pkg.product.priceString,
    priceAmount: Number.isFinite(pkg.product.price) ? pkg.product.price : null,
    currencyCode: pkg.product.currencyCode ?? null,
    billingCycle: meta.billingCycle,
    plan: meta.plan,
    source: pkg,
  };
}

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

export async function getBillingOfferings(): Promise<BillingOfferings | null> {
  if (!isRevenueCatConfigured()) return null;

  const offerings = await Purchases.getOfferings();
  const packages = (offerings.current?.availablePackages ?? [])
    .map(mapNativePackage)
    .filter((pkg): pkg is BillingPackage => pkg != null);

  return { packages };
}

export async function purchaseBillingPackage(billingPackage: BillingPackage): Promise<ClinicPlan> {
  const nativePackage = billingPackage.source as PurchasesPackage;
  const { customerInfo } = await Purchases.purchasePackage(nativePackage);
  return getClinicPlanFromCustomerInfo(customerInfo);
}

export async function restoreRevenueCatPurchases(): Promise<ClinicPlan> {
  const customerInfo = await Purchases.restorePurchases();
  return getClinicPlanFromCustomerInfo(customerInfo);
}

export function getClinicPlanFromCustomerInfo(customerInfo: CustomerInfo): ClinicPlan {
  return getClinicPlanFromEntitlements(customerInfo.entitlements.active);
}

export async function getCurrentClinicPlan(): Promise<ClinicPlan | null> {
  if (!isRevenueCatConfigured()) return null;
  const customerInfo = await Purchases.getCustomerInfo();
  return getClinicPlanFromCustomerInfo(customerInfo);
}

export async function openSubscriptionManagement(): Promise<boolean> {
  return false;
}
