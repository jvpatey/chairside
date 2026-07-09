import {
  CLINIC_PLAN_MARKETING,
  type ClinicPlan,
} from '@chairside/config';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { BillingCycleToggle } from '@/components/billing/BillingCycleToggle';
import { BillingHero } from '@/components/billing/BillingHero';
import { PlanComparisonCard } from '@/components/billing/PlanComparisonCard';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { useProfileDetailScroll } from '@/components/profile/ProfileDetailScreen';
import {
  getClinicPlanLabel,
  useClinicBilling,
} from '@/contexts/ClinicBillingContext';
import {
  computeYearlySavings,
  findBillingPackage,
  formatBillingPackagePrice,
  type BillingCycle,
  type BillingPackage,
} from '@/lib/billingOfferings';
import { getRecommendedUpgradePlan } from '@/lib/clinicPlanPresentation';
import { CLINIC_PROFILE_BILLING } from '@/lib/routing';
import { colorWithAlpha, useThemedStyles } from '@/theme';

function getBillingCycleLabel(
  billingCycle: BillingCycle,
  monthlyPackage: BillingPackage | undefined,
  yearlyPackage: BillingPackage | undefined,
): string | null {
  if (billingCycle === 'monthly' && monthlyPackage) {
    return 'Billed monthly';
  }

  if (billingCycle === 'yearly' && yearlyPackage) {
    return 'Billed annually';
  }

  return null;
}

function PlanComparisonIntro() {
  const styles = useThemedStyles(({ colors, spacing, typography, radii, isDark }) => ({
    card: {
      backgroundColor: colorWithAlpha(colors.fillSubtle, isDark ? 0.65 : 1),
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      gap: spacing.xs,
    },
    title: {
      ...typography.body,
      fontWeight: '700',
      fontSize: 16,
      color: colors.labelPrimary,
    },
    body: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
  }));

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Choose the plan that fits your clinic</Text>
      <Text style={styles.body}>
        Workers stay free. Upgrade when you need more active postings, direct outreach, SMS alerts,
        or priority placement.
      </Text>
    </View>
  );
}

export function ClinicBillingScreenContent() {
  const {
    billing,
    offerings,
    purchasePackage,
    restorePurchases,
    manageSubscription,
    isPurchasing,
    isRestoring,
    isManagingSubscription,
    billingError,
    isNativeBillingAvailable,
    isWebBillingAvailable,
    isPurchaseBillingAvailable,
    canManageSubscription,
    isBillingReady,
    isRefreshing,
  } = useClinicBilling();
  const [localError, setLocalError] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const plansSectionRef = useRef<View>(null);
  const profileScroll = useProfileDetailScroll();

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    content: { gap: spacing.lg },
    helper: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelTertiary,
    },
    actionLink: { alignSelf: 'center', paddingVertical: spacing.sm },
    actionLinkText: { ...typography.body, fontWeight: '600', color: colors.primary },
    loadingWrap: { alignItems: 'center', paddingVertical: spacing.xl },
    planList: { gap: spacing.md },
    compareSection: { gap: spacing.md },
  }));

  const starterMonthly = useMemo(
    () => findBillingPackage(offerings, 'starter', 'monthly'),
    [offerings],
  );
  const starterYearly = useMemo(
    () => findBillingPackage(offerings, 'starter', 'yearly'),
    [offerings],
  );
  const proMonthly = useMemo(() => findBillingPackage(offerings, 'pro', 'monthly'), [offerings]);
  const proYearly = useMemo(() => findBillingPackage(offerings, 'pro', 'yearly'), [offerings]);

  const hasMonthly = Boolean(starterMonthly || proMonthly);
  const hasYearly = Boolean(starterYearly || proYearly);

  const starterYearlySavings = useMemo(
    () => computeYearlySavings(starterMonthly, starterYearly),
    [starterMonthly, starterYearly],
  );
  const proYearlySavings = useMemo(
    () => computeYearlySavings(proMonthly, proYearly),
    [proMonthly, proYearly],
  );
  const maxYearlySavingsPercent = useMemo(() => {
    const percents = [starterYearlySavings?.percent, proYearlySavings?.percent].filter(
      (value): value is number => value != null && value > 0,
    );
    return percents.length > 0 ? Math.max(...percents) : null;
  }, [proYearlySavings?.percent, starterYearlySavings?.percent]);

  const handlePurchase = async (purchasePackageArg: BillingPackage | undefined) => {
    if (!purchasePackageArg) {
      setLocalError(
        isWebBillingAvailable
          ? 'This plan is not available yet in RevenueCat Web Billing.'
          : 'This plan is not available yet in App Store Connect.',
      );
      return;
    }

    setLocalError(null);
    try {
      await purchasePackage(purchasePackageArg);
    } catch {
      // Error state handled in context.
    }
  };

  if (!isBillingReady || isRefreshing) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator />
      </View>
    );
  }

  const currentPlan = billing?.plan ?? 'free';
  const recommendedUpgrade = getRecommendedUpgradePlan(currentPlan);

  const starterPackage = billingCycle === 'monthly' ? starterMonthly : starterYearly;
  const proPackage = billingCycle === 'monthly' ? proMonthly : proYearly;

  const starterPrice =
    formatBillingPackagePrice(starterPackage, billingCycle) ??
    CLINIC_PLAN_MARKETING.starter.fallbackPriceLabel;
  const proPrice =
    formatBillingPackagePrice(proPackage, billingCycle) ??
    CLINIC_PLAN_MARKETING.pro.fallbackPriceLabel;

  const getRecommendedPackage = (plan: ClinicPlan): BillingPackage | undefined => {
    if (plan === 'starter') return starterPackage ?? starterMonthly ?? starterYearly;
    if (plan === 'pro') return proPackage ?? proMonthly ?? proYearly;
    return undefined;
  };

  const scrollToComparePlans = () => {
    const scrollRef = profileScroll?.scrollRef.current;
    const scrollContentRef = profileScroll?.scrollContentRef.current;
    const plansSection = plansSectionRef.current;
    if (!scrollRef || !scrollContentRef || !plansSection) return;

    plansSection.measureLayout(
      scrollContentRef,
      (_x, y) => {
        profileScroll?.scrollRef.current?.scrollTo({
          y: Math.max(0, y - 24),
          animated: true,
        });
      },
      () => {},
    );
  };

  return (
    <View style={styles.content}>
      {billing ? (
        <BillingHero
          billing={billing}
          canManageSubscription={canManageSubscription}
          isManagingSubscription={isManagingSubscription}
          isPurchaseBillingAvailable={isPurchaseBillingAvailable}
          isPurchasing={isPurchasing}
          recommendedUpgradeLabel={
            recommendedUpgrade
              ? `Upgrade to ${getClinicPlanLabel(recommendedUpgrade)}`
              : null
          }
          onManageSubscription={() => {
            setLocalError(null);
            void manageSubscription().catch(() => {});
          }}
          onUpgrade={
            recommendedUpgrade
              ? () => void handlePurchase(getRecommendedPackage(recommendedUpgrade))
              : undefined
          }
          onComparePlans={scrollToComparePlans}
        />
      ) : null}

      <View ref={plansSectionRef} style={styles.compareSection}>
        <PlanComparisonIntro />

        {isWebBillingAvailable ? (
          <Text style={styles.helper}>
            Subscribe securely on the web. Your plan syncs across web and the iOS app on the same
            clinic account.
          </Text>
        ) : null}

        {!isPurchaseBillingAvailable ? (
          <Text style={styles.helper}>
            In-app purchases require the native iOS app with App Store products configured. You can
            still review plans here.
          </Text>
        ) : null}

        {isPurchaseBillingAvailable ? (
          <BillingCycleToggle
            value={billingCycle}
            onChange={setBillingCycle}
            hasMonthly={hasMonthly}
            hasYearly={hasYearly}
            yearlySavingsPercent={maxYearlySavingsPercent}
          />
        ) : null}

        <View style={styles.planList}>
          <PlanComparisonCard
            plan="free"
            priceLabel={CLINIC_PLAN_MARKETING.free.fallbackPriceLabel}
            billingCycleLabel="Includes 1 active role and 1 active fill-in"
            isCurrent={currentPlan === 'free'}
            actionLabel={currentPlan === 'free' ? 'Current plan' : 'Included with your account'}
            actionVariant="secondary"
            disabled
          />

          <PlanComparisonCard
            plan="starter"
            priceLabel={starterPrice}
            billingCycleLabel={getBillingCycleLabel(billingCycle, starterMonthly, starterYearly)}
            yearlySavings={billingCycle === 'yearly' ? starterYearlySavings : null}
            isCurrent={currentPlan === 'starter'}
            isRecommended={currentPlan === 'free'}
            actionLabel={
              currentPlan === 'starter'
                ? 'Current plan'
                : currentPlan === 'pro'
                  ? 'Included in Pro'
                  : 'Upgrade to Starter'
            }
            actionVariant={currentPlan === 'free' ? 'primary' : 'secondary'}
            disabled={
              !isPurchaseBillingAvailable ||
              currentPlan === 'starter' ||
              currentPlan === 'pro' ||
              isPurchasing
            }
            loading={isPurchasing}
            onPress={
              isPurchaseBillingAvailable && currentPlan === 'free'
                ? () => void handlePurchase(starterPackage ?? starterMonthly ?? starterYearly)
                : undefined
            }
          />

          <PlanComparisonCard
            plan="pro"
            priceLabel={proPrice}
            billingCycleLabel={getBillingCycleLabel(billingCycle, proMonthly, proYearly)}
            yearlySavings={billingCycle === 'yearly' ? proYearlySavings : null}
            isCurrent={currentPlan === 'pro'}
            isRecommended={currentPlan === 'starter'}
            actionLabel={currentPlan === 'pro' ? 'Current plan' : 'Upgrade to Pro'}
            actionVariant="primary"
            disabled={!isPurchaseBillingAvailable || currentPlan === 'pro' || isPurchasing}
            loading={isPurchasing}
            onPress={
              isPurchaseBillingAvailable && currentPlan !== 'pro'
                ? () => void handlePurchase(proPackage ?? proMonthly ?? proYearly)
                : undefined
            }
          />
        </View>
      </View>

      {isNativeBillingAvailable ? (
        <Pressable
          style={styles.actionLink}
          disabled={isRestoring}
          onPress={() => {
            setLocalError(null);
            void restorePurchases().catch(() => {});
          }}>
          <Text style={styles.actionLinkText}>
            {isRestoring ? 'Restoring…' : 'Restore purchases'}
          </Text>
        </Pressable>
      ) : null}

      <FormErrorBanner message={localError ?? billingError} />
    </View>
  );
}

export function openClinicBillingScreen() {
  router.push(CLINIC_PROFILE_BILLING);
}
