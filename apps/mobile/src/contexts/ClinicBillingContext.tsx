import {
  getClinicBillingState,
  syncClinicSubscriptionFromRevenueCat,
  type ClinicBillingState,
} from '@chairside/api';
import {
  CLINIC_PLAN_LABELS,
  type ClinicPlan,
} from '@chairside/config';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import type { PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';

import { useAuth } from '@/contexts/AuthContext';
import {
  configureRevenueCat,
  getRevenueCatCustomerInfo,
  getRevenueCatOfferings,
  getClinicPlanFromCustomerInfo,
  logOutRevenueCat,
  purchaseRevenueCatPackage,
  restoreRevenueCatPurchases,
} from '@/lib/revenueCat';
import { isRevenueCatConfigured } from '@/lib/revenueCatEnv';

type ClinicBillingContextValue = {
  billing: ClinicBillingState | null;
  isBillingReady: boolean;
  isRefreshing: boolean;
  offerings: PurchasesOfferings | null;
  revenueCatPlan: ClinicPlan | null;
  refreshBilling: () => Promise<void>;
  purchasePackage: (purchasePackage: PurchasesPackage) => Promise<void>;
  restorePurchases: () => Promise<void>;
  isPurchasing: boolean;
  isRestoring: boolean;
  billingError: string | null;
  isNativeBillingAvailable: boolean;
};

const ClinicBillingContext = createContext<ClinicBillingContextValue | null>(null);

const DEFAULT_BILLING: ClinicBillingState = {
  plan: 'free',
  status: 'active',
  activeRoleCount: 0,
  activeRoleLimit: 1,
  activeFillInCount: 0,
  activeFillInLimit: 1,
  canPublishRole: true,
  canPublishFillIn: true,
  activeOpportunityCount: 0,
  activeOpportunityLimit: null,
  canPublishOpportunity: true,
  canUseFillInOutreach: false,
  canUseFillInSms: false,
  hasPriorityListing: false,
  currentPeriodEnd: null,
};

export function ClinicBillingProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const isClinic = profile?.role === 'clinic';
  const clinicId = isClinic ? user?.id : undefined;

  const [billing, setBilling] = useState<ClinicBillingState | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [revenueCatPlan, setRevenueCatPlan] = useState<ClinicPlan | null>(null);
  const [isBillingReady, setIsBillingReady] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);

  const isNativeBillingAvailable = Platform.OS !== 'web' && isRevenueCatConfigured();

  const refreshBilling = useCallback(async () => {
    if (!clinicId) {
      setBilling(null);
      setOfferings(null);
      setRevenueCatPlan(null);
      setIsBillingReady(true);
      return;
    }

    setIsRefreshing(true);
    setBillingError(null);
    try {
      if (isNativeBillingAvailable) {
        await configureRevenueCat(clinicId);
        const [nextBilling, nextOfferings, customerInfo] = await Promise.all([
          getClinicBillingState(clinicId),
          getRevenueCatOfferings(),
          getRevenueCatCustomerInfo(),
        ]);
        setBilling(nextBilling);
        setOfferings(nextOfferings);
        setRevenueCatPlan(customerInfo ? getClinicPlanFromCustomerInfo(customerInfo) : null);
      } else {
        const nextBilling = await getClinicBillingState(clinicId);
        setBilling(nextBilling);
        setOfferings(null);
        setRevenueCatPlan(null);
      }
    } catch (error) {
      setBilling(DEFAULT_BILLING);
      setBillingError(error instanceof Error ? error.message : 'Could not load billing.');
    } finally {
      setIsRefreshing(false);
      setIsBillingReady(true);
    }
  }, [clinicId, isNativeBillingAvailable]);

  useEffect(() => {
    setIsBillingReady(false);
    void refreshBilling();
  }, [refreshBilling]);

  useEffect(() => {
    if (!clinicId) {
      void logOutRevenueCat();
    }
  }, [clinicId]);

  const purchasePackage = useCallback(
    async (purchasePackage: PurchasesPackage) => {
      if (!clinicId || !isNativeBillingAvailable) return;

      setIsPurchasing(true);
      setBillingError(null);
      try {
        const customerInfo = await purchaseRevenueCatPackage(purchasePackage);
        setRevenueCatPlan(getClinicPlanFromCustomerInfo(customerInfo));
        await syncClinicSubscriptionFromRevenueCat();
        await refreshBilling();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Purchase failed.';
        if (!message.toLowerCase().includes('cancel')) {
          setBillingError(message);
        }
        throw error;
      } finally {
        setIsPurchasing(false);
      }
    },
    [clinicId, isNativeBillingAvailable, refreshBilling],
  );

  const restorePurchases = useCallback(async () => {
    if (!clinicId || !isNativeBillingAvailable) return;

    setIsRestoring(true);
    setBillingError(null);
    try {
      const customerInfo = await restoreRevenueCatPurchases();
      setRevenueCatPlan(getClinicPlanFromCustomerInfo(customerInfo));
      await syncClinicSubscriptionFromRevenueCat();
      await refreshBilling();
    } catch (error) {
      setBillingError(error instanceof Error ? error.message : 'Could not restore purchases.');
      throw error;
    } finally {
      setIsRestoring(false);
    }
  }, [clinicId, isNativeBillingAvailable, refreshBilling]);

  const value = useMemo<ClinicBillingContextValue>(
    () => ({
      billing,
      isBillingReady,
      isRefreshing,
      offerings,
      revenueCatPlan,
      refreshBilling,
      purchasePackage,
      restorePurchases,
      isPurchasing,
      isRestoring,
      billingError,
      isNativeBillingAvailable,
    }),
    [
      billing,
      billingError,
      isBillingReady,
      isNativeBillingAvailable,
      isPurchasing,
      isRefreshing,
      isRestoring,
      offerings,
      purchasePackage,
      refreshBilling,
      restorePurchases,
      revenueCatPlan,
    ],
  );

  return <ClinicBillingContext.Provider value={value}>{children}</ClinicBillingContext.Provider>;
}

export function useClinicBilling() {
  const context = useContext(ClinicBillingContext);
  if (!context) {
    throw new Error('useClinicBilling must be used within ClinicBillingProvider');
  }
  return context;
}

export function getClinicPlanLabel(plan: ClinicPlan): string {
  return CLINIC_PLAN_LABELS[plan];
}
