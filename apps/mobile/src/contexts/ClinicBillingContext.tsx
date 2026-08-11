import {
  getClinicBillingState,
  isAlreadySubscribedPurchaseError,
  isPaidClinicPlan,
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
  useRef,
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
  isHealingSubscription: boolean;
  offerings: BillingOfferings | null;
  revenueCatPlan: ClinicPlan | null;
  refreshBilling: (options?: { forceSubscriptionSync?: boolean }) => Promise<void>;
  purchasePackage: (purchasePackage: BillingPackage) => Promise<ClinicPlan | null>;
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
  planFamily: 'clinic',
  accountType: 'individual',
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
  canUseScreeningQuestions: false,
  canUseCrmFollowups: false,
  canUseApplicationPdfExport: false,
  canUseClinicDiscover: false,
  canUseGeneralCandidateMessaging: false,
  canUseBulkOutreach: false,
  canUseHiringInsights: false,
  customScreeningLimit: 0,
  locationCount: 0,
  maxLocations: 1,
  canAddLocation: true,
  managerCount: 0,
  maxManagers: 0,
  canAddManager: false,
  currentPeriodEnd: null,
};

function isPaidBillingState(state: ClinicBillingState | null | undefined): boolean {
  return Boolean(state && isPaidClinicPlan(state.plan) && state.status !== 'expired');
}

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
  const [isHealingSubscription, setIsHealingSubscription] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [canManageSubscription, setCanManageSubscription] = useState(false);
  const refreshGenerationRef = useRef(0);
  const billingRef = useRef<ClinicBillingState | null>(null);
  /** Avoid hammering revenuecat-sync on every visibility refresh for the same desync. */
  const healedDesyncKeyRef = useRef<string | null>(null);

  const isNativeBillingAvailable = Platform.OS !== 'web' && isRevenueCatConfigured();
  const isWebBillingAvailable = Platform.OS === 'web' && isWebRevenueCatConfigured();
  const isPurchaseBillingAvailable = isNativeBillingAvailable || isWebBillingAvailable;

  useEffect(() => {
    billingRef.current = billing;
  }, [billing]);

  const refreshBilling = useCallback(async (options?: { forceSubscriptionSync?: boolean }) => {
    if (!clinicId) {
      setBilling(null);
      setOfferings(null);
      setRevenueCatPlan(null);
      setCanManageSubscription(false);
      setIsHealingSubscription(false);
      healedDesyncKeyRef.current = null;
      setIsBillingReady(true);
      return;
    }

    const generation = ++refreshGenerationRef.current;
    setIsRefreshing(true);
    setBillingError(null);

    const isStale = () => generation !== refreshGenerationRef.current;

    try {
      if (isPurchaseBillingAvailable) {
        await configureRevenueCat(clinicId);

        let nextBilling: ClinicBillingState;
        try {
          nextBilling = await getClinicBillingState(clinicId);
        } catch (error) {
          if (isStale()) return;
          setBillingError(error instanceof Error ? error.message : 'Could not load billing.');
          if (!isPaidBillingState(billingRef.current)) {
            setBilling(DEFAULT_BILLING);
          }
          return;
        }

        if (isStale()) return;

        let nextOfferings: BillingOfferings | null = null;
        let nextRevenueCatPlan: ClinicPlan | null = null;
        let revenueCatLoadFailed = false;

        try {
          const [offeringsResult, planResult] = await Promise.all([
            getBillingOfferings(),
            getCurrentClinicPlan(),
          ]);
          nextOfferings = offeringsResult;
          nextRevenueCatPlan = planResult;
        } catch (error) {
          revenueCatLoadFailed = true;
          if (isStale()) return;
          setBillingError(
            error instanceof Error ? error.message : 'Could not load subscription offerings.',
          );
        }

        if (isStale()) return;

        const desyncKey =
          nextRevenueCatPlan != null && isPaidClinicPlan(nextRevenueCatPlan)
            ? `${clinicId}:${nextRevenueCatPlan}`
            : null;
        const shouldHealDesync =
          isOwner &&
          desyncKey != null &&
          nextBilling.plan === 'free' &&
          (options?.forceSubscriptionSync || healedDesyncKeyRef.current !== desyncKey);

        if (shouldHealDesync && desyncKey) {
          healedDesyncKeyRef.current = desyncKey;
          setIsHealingSubscription(true);
          try {
            await syncClinicSubscriptionFromRevenueCat();
            if (isStale()) return;
            nextBilling = await getClinicBillingState(clinicId);
            if (isPaidClinicPlan(nextBilling.plan)) {
              healedDesyncKeyRef.current = null;
            }
          } catch (error) {
            if (isStale()) return;
            setBillingError(
              error instanceof Error ? error.message : 'Could not sync subscription.',
            );
          } finally {
            if (!isStale()) {
              setIsHealingSubscription(false);
            }
          }
        } else if (
          isOwner &&
          desyncKey != null &&
          nextBilling.plan === 'free' &&
          healedDesyncKeyRef.current === desyncKey
        ) {
          setIsHealingSubscription(false);
        }

        if (isStale()) return;

        setBilling(nextBilling);
        if (!revenueCatLoadFailed) {
          setOfferings(nextOfferings);
          setRevenueCatPlan(nextRevenueCatPlan);
        }
        setCanManageSubscription(
          isOwner &&
            isWebBillingAvailable &&
            nextBilling.plan !== 'free' &&
            nextBilling.status !== 'expired',
        );
      } else {
        const nextBilling = await getClinicBillingState(clinicId);
        if (isStale()) return;
        setBilling(nextBilling);
        setOfferings(null);
        setRevenueCatPlan(null);
        setCanManageSubscription(false);
      }
    } catch (error) {
      if (isStale()) return;
      setBillingError(error instanceof Error ? error.message : 'Could not load billing.');
      if (!isPaidBillingState(billingRef.current)) {
        setBilling(DEFAULT_BILLING);
      }
    } finally {
      if (!isStale()) {
        setIsRefreshing(false);
        setIsBillingReady(true);
      }
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
    async (purchasePackageArg: BillingPackage): Promise<ClinicPlan | null> => {
      if (!clinicId || !isPurchaseBillingAvailable || !isOwner) return null;

      setIsPurchasing(true);
      setBillingError(null);
      try {
        const nextPlan = await purchaseBillingPackage(purchasePackageArg);
        setRevenueCatPlan(nextPlan);
        await syncClinicSubscriptionFromRevenueCat();
        await refreshBilling();
        return nextPlan;
      } catch (error) {
        if (isAlreadySubscribedPurchaseError(error)) {
          try {
            setIsHealingSubscription(true);
            healedDesyncKeyRef.current = null;
            const synced = await syncClinicSubscriptionFromRevenueCat();
            setRevenueCatPlan(synced.plan);
            await refreshBilling({ forceSubscriptionSync: true });
            setBillingError(null);
            return synced.plan;
          } catch (syncError) {
            setBillingError(
              syncError instanceof Error ? syncError.message : 'Could not sync subscription.',
            );
            throw syncError;
          } finally {
            setIsHealingSubscription(false);
          }
        }

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
    if (!clinicId || !isPurchaseBillingAvailable || !isOwner) return;

    setIsRestoring(true);
    setBillingError(null);
    try {
      await configureRevenueCat(clinicId);
      const nextPlan = await restoreRevenueCatPurchases();
      setRevenueCatPlan(nextPlan);
      healedDesyncKeyRef.current = null;
      await syncClinicSubscriptionFromRevenueCat();
      await refreshBilling({ forceSubscriptionSync: true });
    } catch (error) {
      setBillingError(error instanceof Error ? error.message : 'Could not restore purchases.');
      throw error;
    } finally {
      setIsRestoring(false);
    }
  }, [clinicId, isOwner, isPurchaseBillingAvailable, refreshBilling]);

  const manageSubscription = useCallback(async () => {
    if (!clinicId || !isWebBillingAvailable || !isOwner) return;

    setIsManagingSubscription(true);
    setBillingError(null);
    try {
      const opened = await openSubscriptionManagement();
      if (!opened) {
        setBillingError('Subscription management is not available for this account yet.');
        return;
      }

      // Portal opens in another tab; sync current RC state now and again on visibility return.
      try {
        healedDesyncKeyRef.current = null;
        await syncClinicSubscriptionFromRevenueCat();
        await refreshBilling({ forceSubscriptionSync: true });
      } catch (syncError) {
        setBillingError(
          syncError instanceof Error ? syncError.message : 'Could not sync subscription.',
        );
      }
    } catch (error) {
      setBillingError(
        error instanceof Error ? error.message : 'Could not open subscription management.',
      );
      throw error;
    } finally {
      setIsManagingSubscription(false);
    }
  }, [clinicId, isOwner, isWebBillingAvailable, refreshBilling]);

  const value = useMemo<ClinicBillingContextValue>(
    () => ({
      billing,
      isBillingReady,
      isRefreshing,
      isHealingSubscription,
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
      isHealingSubscription,
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
