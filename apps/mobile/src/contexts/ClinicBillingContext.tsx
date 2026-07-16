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

import type { BillingOfferings, BillingPackage } from '@/lib/billingOfferings';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import {
  configureRevenueCat,
  getBillingOfferings,
  getCurrentClinicPlan,
  logOutRevenueCat,
  openSubscriptionManagement,
  purchaseBillingPackage,
  restoreRevenueCatPurchases,
} from '@/lib/revenueCat';
import { isRevenueCatConfigured, isWebRevenueCatConfigured } from '@/lib/revenueCatEnv';

type ClinicBillingContextValue = {
  billing: ClinicBillingState | null;
  isBillingReady: boolean;
  isRefreshing: boolean;
  offerings: BillingOfferings | null;
  revenueCatPlan: ClinicPlan | null;
  refreshBilling: () => Promise<void>;
  purchasePackage: (purchasePackage: BillingPackage) => Promise<void>;
  restorePurchases: () => Promise<void>;
  manageSubscription: () => Promise<void>;
  isPurchasing: boolean;
  isRestoring: boolean;
  isManagingSubscription: boolean;
  billingError: string | null;
  isNativeBillingAvailable: boolean;
  isWebBillingAvailable: boolean;
  isPurchaseBillingAvailable: boolean;
  canManageSubscription: boolean;
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
  const { profile } = useAuth();
  const { clinicId: organizationClinicId, isClinicProfileReady, isOwner } = useClinicProfile();
  const isClinic = profile?.role === 'clinic';
  /** Billing attaches to the organization (owner) id, not invited managers. */
  const clinicId = isClinic ? organizationClinicId ?? undefined : undefined;

  const [billing, setBilling] = useState<ClinicBillingState | null>(null);
  const [offerings, setOfferings] = useState<BillingOfferings | null>(null);
  const [revenueCatPlan, setRevenueCatPlan] = useState<ClinicPlan | null>(null);
  const [isBillingReady, setIsBillingReady] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [canManageSubscription, setCanManageSubscription] = useState(false);

  const isNativeBillingAvailable = Platform.OS !== 'web' && isRevenueCatConfigured();
  const isWebBillingAvailable = Platform.OS === 'web' && isWebRevenueCatConfigured();
  const isPurchaseBillingAvailable = isNativeBillingAvailable || isWebBillingAvailable;

  const refreshBilling = useCallback(async () => {
    if (!clinicId) {
      setBilling(null);
      setOfferings(null);
      setRevenueCatPlan(null);
      setCanManageSubscription(false);
      setIsBillingReady(true);
      return;
    }

    setIsRefreshing(true);
    setBillingError(null);
    try {
      if (isPurchaseBillingAvailable) {
        await configureRevenueCat(clinicId);
        const [nextBilling, nextOfferings, nextRevenueCatPlan] = await Promise.all([
          getClinicBillingState(clinicId),
          getBillingOfferings(),
          getCurrentClinicPlan(),
        ]);
        setBilling(nextBilling);
        setOfferings(nextOfferings);
        setRevenueCatPlan(nextRevenueCatPlan);
        setCanManageSubscription(
          isOwner &&
            isWebBillingAvailable &&
            nextBilling.plan !== 'free' &&
            nextBilling.status !== 'expired',
        );
      } else {
        const nextBilling = await getClinicBillingState(clinicId);
        setBilling(nextBilling);
        setOfferings(null);
        setRevenueCatPlan(null);
        setCanManageSubscription(false);
      }
    } catch (error) {
      setBilling(DEFAULT_BILLING);
      setBillingError(error instanceof Error ? error.message : 'Could not load billing.');
    } finally {
      setIsRefreshing(false);
      setIsBillingReady(true);
    }
  }, [clinicId, isOwner, isPurchaseBillingAvailable, isWebBillingAvailable]);

  useEffect(() => {
    if (isClinic && !isClinicProfileReady) {
      setIsBillingReady(false);
      return;
    }
    setIsBillingReady(false);
    void refreshBilling();
  }, [isClinic, isClinicProfileReady, refreshBilling]);

  useEffect(() => {
    if (!clinicId) {
      void logOutRevenueCat();
    }
  }, [clinicId]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshBilling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshBilling]);

  const purchasePackage = useCallback(
    async (purchasePackageArg: BillingPackage) => {
      if (!clinicId || !isPurchaseBillingAvailable || !isOwner) return;

      setIsPurchasing(true);
      setBillingError(null);
      try {
        const nextPlan = await purchaseBillingPackage(purchasePackageArg);
        setRevenueCatPlan(nextPlan);
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
    [clinicId, isOwner, isPurchaseBillingAvailable, refreshBilling],
  );

  const restorePurchases = useCallback(async () => {
    if (!clinicId || !isNativeBillingAvailable || !isOwner) return;

    setIsRestoring(true);
    setBillingError(null);
    try {
      const nextPlan = await restoreRevenueCatPurchases();
      setRevenueCatPlan(nextPlan);
      await syncClinicSubscriptionFromRevenueCat();
      await refreshBilling();
    } catch (error) {
      setBillingError(error instanceof Error ? error.message : 'Could not restore purchases.');
      throw error;
    } finally {
      setIsRestoring(false);
    }
  }, [clinicId, isNativeBillingAvailable, isOwner, refreshBilling]);

  const manageSubscription = useCallback(async () => {
    if (!clinicId || !isWebBillingAvailable || !isOwner) return;

    setIsManagingSubscription(true);
    setBillingError(null);
    try {
      const opened = await openSubscriptionManagement();
      if (!opened) {
        setBillingError('Subscription management is not available for this account yet.');
      }
    } catch (error) {
      setBillingError(
        error instanceof Error ? error.message : 'Could not open subscription management.',
      );
      throw error;
    } finally {
      setIsManagingSubscription(false);
    }
  }, [clinicId, isOwner, isWebBillingAvailable]);

  const value = useMemo<ClinicBillingContextValue>(
    () => ({
      billing,
      isBillingReady,
      isRefreshing,
      offerings: isOwner ? offerings : null,
      revenueCatPlan,
      refreshBilling,
      purchasePackage,
      restorePurchases,
      manageSubscription,
      isPurchasing,
      isRestoring,
      isManagingSubscription,
      billingError,
      isNativeBillingAvailable: isOwner && isNativeBillingAvailable,
      isWebBillingAvailable: isOwner && isWebBillingAvailable,
      isPurchaseBillingAvailable: isOwner && isPurchaseBillingAvailable,
      canManageSubscription,
    }),
    [
      billing,
      billingError,
      canManageSubscription,
      isBillingReady,
      isManagingSubscription,
      isNativeBillingAvailable,
      isOwner,
      isPurchaseBillingAvailable,
      isPurchasing,
      isRefreshing,
      isRestoring,
      isWebBillingAvailable,
      manageSubscription,
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
