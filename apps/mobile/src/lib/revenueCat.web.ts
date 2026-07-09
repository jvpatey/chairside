import {
  ErrorCode,
  LogLevel,
  Purchases,
  PurchasesError,
  type CustomerInfo,
  type Package,
} from '@revenuecat/purchases-js';
import type { ClinicPlan } from '@chairside/config';

import {
  getClinicPlanFromEntitlements,
  normalizeWebBillingPriceAmount,
  resolveBillingPackageMeta,
  type BillingOfferings,
  type BillingPackage,
} from '@/lib/billingOfferings';
import {
  getRevenueCatWebApiKey,
  isWebRevenueCatConfigured,
} from '@/lib/revenueCatEnv';

let configuredForUserId: string | null = null;
let cachedManagementUrl: string | null = null;

function mapWebPackage(pkg: Package): BillingPackage | null {
  const product = pkg.webBillingProduct;
  const meta = resolveBillingPackageMeta([pkg.identifier, product.identifier]);
  if (!meta) return null;

  return {
    identifier: pkg.identifier,
    productIdentifier: product.identifier,
    priceLabel: product.price.formattedPrice,
    priceAmount: normalizeWebBillingPriceAmount(product.price),
    currencyCode: product.price.currency ?? null,
    billingCycle: meta.billingCycle,
    plan: meta.plan,
    source: pkg,
  };
}

function getPurchasesInstance(): Purchases {
  return Purchases.getSharedInstance();
}

async function ensureConfigured(appUserId: string): Promise<void> {
  if (!isWebRevenueCatConfigured()) return;

  const apiKey = getRevenueCatWebApiKey();
  if (!apiKey) return;

  if (Purchases.isConfigured()) {
    if (configuredForUserId !== appUserId) {
      await getPurchasesInstance().changeUser(appUserId);
      configuredForUserId = appUserId;
    }
    return;
  }

  if (__DEV__) {
    Purchases.setLogLevel(LogLevel.Debug);
  }

  Purchases.configure({
    apiKey,
    appUserId,
  });
  configuredForUserId = appUserId;
}

function updateManagementUrl(customerInfo: CustomerInfo): void {
  cachedManagementUrl = customerInfo.managementURL;
}

export async function configureRevenueCat(appUserId: string): Promise<void> {
  await ensureConfigured(appUserId);
}

export async function logOutRevenueCat(): Promise<void> {
  if (!Purchases.isConfigured() || !configuredForUserId) return;

  await getPurchasesInstance().changeUser(Purchases.generateRevenueCatAnonymousAppUserId());
  configuredForUserId = null;
  cachedManagementUrl = null;
}

export async function getBillingOfferings(): Promise<BillingOfferings | null> {
  if (!isWebRevenueCatConfigured() || !Purchases.isConfigured()) return null;

  const offerings = await getPurchasesInstance().getOfferings();
  const packages = (offerings.current?.availablePackages ?? [])
    .map(mapWebPackage)
    .filter((pkg): pkg is BillingPackage => pkg != null);

  return { packages };
}

export async function purchaseBillingPackage(billingPackage: BillingPackage): Promise<ClinicPlan> {
  const webPackage = billingPackage.source as Package;

  try {
    const purchaseResult = await getPurchasesInstance().purchase({
      rcPackage: webPackage,
      skipSuccessPage: true,
    });
    updateManagementUrl(purchaseResult.customerInfo);
    return getClinicPlanFromCustomerInfo(purchaseResult.customerInfo);
  } catch (error) {
    if (error instanceof PurchasesError && error.errorCode === ErrorCode.UserCancelledError) {
      throw new Error('Purchase cancelled.');
    }
    throw error;
  }
}

export async function restoreRevenueCatPurchases(): Promise<ClinicPlan> {
  return getCurrentClinicPlan() ?? 'free';
}

export function getClinicPlanFromCustomerInfo(customerInfo: CustomerInfo): ClinicPlan {
  return getClinicPlanFromEntitlements(customerInfo.entitlements.active);
}

export async function getCurrentClinicPlan(): Promise<ClinicPlan | null> {
  if (!isWebRevenueCatConfigured() || !Purchases.isConfigured()) return null;

  const customerInfo = await getPurchasesInstance().getCustomerInfo();
  updateManagementUrl(customerInfo);
  return getClinicPlanFromCustomerInfo(customerInfo);
}

export function getSubscriptionManagementUrl(): string | null {
  return cachedManagementUrl;
}

export async function openSubscriptionManagement(): Promise<boolean> {
  if (!isWebRevenueCatConfigured() || !Purchases.isConfigured()) return false;

  const customerInfo = await getPurchasesInstance().getCustomerInfo();
  updateManagementUrl(customerInfo);

  if (!customerInfo.managementURL) return false;

  window.open(customerInfo.managementURL, '_blank', 'noopener,noreferrer');
  return true;
}
