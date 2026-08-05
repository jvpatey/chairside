import {
  CLINIC_PLAN_MARKETING,
  type ClinicPlan,
} from '@chairside/config';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

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
  type BillingPlan,
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

function PlanComparisonIntro({ isGroupFamily }: { isGroupFamily: boolean }) {
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
      <Text style={styles.title}>
        {isGroupFamily ? 'Choose the plan that fits your group' : 'Choose the plan that fits your clinic'}
      </Text>
      <Text style={styles.body}>
        {isGroupFamily
          ? 'Workers stay free. Upgrade for more locations and managers, hiring tools, and org-wide posting limits.'
          : 'Workers stay free. Upgrade when you need more active postings, direct outreach, SMS alerts, or priority placement.'}
      </Text>
    </View>
  );
}

export type ClinicBillingScrollFocus = 'default' | 'group' | 'clinic';

type ClinicBillingScreenContentProps = {
  /** When rendered inside the billing modal, used to scroll to plan sections. */
  parentScrollRef?: RefObject<ScrollView | null>;
  scrollContentRef?: RefObject<View | null>;
  scrollFocus?: ClinicBillingScrollFocus;
  onPurchaseSuccess?: (plan: ClinicPlan) => void;
};

function scrollChildIntoScrollContent(
  scrollRef: RefObject<ScrollView | null>,
  scrollContentRef: RefObject<View | null>,
  childRef: RefObject<View | null>,
  offset = 24,
) {
  const scrollContent = scrollContentRef.current;
  const child = childRef.current;
  if (!scrollContent || !child || !scrollRef.current) return;

  child.measureLayout(
    scrollContent,
    (_x, y) => {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - offset), animated: true });
    },
    () => {},
  );
}

export function ClinicBillingScreenContent({
  parentScrollRef,
  scrollContentRef,
  scrollFocus = 'default',
  onPurchaseSuccess,
}: ClinicBillingScreenContentProps = {}) {
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
  const groupPlansSectionRef = useRef<View>(null);
  const clinicPlansSectionRef = useRef<View>(null);
  const profileScroll = useProfileDetailScroll();
  const emphasizeGroupCaps = scrollFocus === 'group';

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    content: { gap: spacing.lg },
    helper: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelTertiary,
    },
    notice: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
      backgroundColor: colors.fillSubtle,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
    },
    noticeEmphasis: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySubtle,
      color: colors.labelPrimary,
    },
    actionLink: { alignSelf: 'center', paddingVertical: spacing.sm },
    actionLinkText: { ...typography.body, fontWeight: '600', color: colors.primary },
    loadingWrap: { alignItems: 'center', paddingVertical: spacing.xl },
    planList: { gap: spacing.md },
    compareSection: { gap: spacing.md },
    sectionLabel: {
      ...typography.label,
      fontSize: 12,
      letterSpacing: 0.4,
      textTransform: 'uppercase' as const,
      color: colors.labelTertiary,
      marginTop: spacing.xs,
    },
  }));

  const isGroupFamily =
    billing?.planFamily === 'group' || billing?.accountType === 'group';

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
  const groupStarterMonthly = useMemo(
    () => findBillingPackage(offerings, 'group_starter', 'monthly'),
    [offerings],
  );
  const groupStarterYearly = useMemo(
    () => findBillingPackage(offerings, 'group_starter', 'yearly'),
    [offerings],
  );
  const groupProMonthly = useMemo(
    () => findBillingPackage(offerings, 'group_pro', 'monthly'),
    [offerings],
  );
  const groupProYearly = useMemo(
    () => findBillingPackage(offerings, 'group_pro', 'yearly'),
    [offerings],
  );

  const hasGroupPackages = Boolean(
    groupStarterMonthly || groupStarterYearly || groupProMonthly || groupProYearly,
  );
  const hasClinicPackages = Boolean(starterMonthly || starterYearly || proMonthly || proYearly);

  const hasMonthly = isGroupFamily
    ? Boolean(groupStarterMonthly || groupProMonthly || starterMonthly || proMonthly)
    : Boolean(starterMonthly || proMonthly);
  const hasYearly = isGroupFamily
    ? Boolean(groupStarterYearly || groupProYearly || starterYearly || proYearly)
    : Boolean(starterYearly || proYearly);

  const starterYearlySavings = useMemo(
    () => computeYearlySavings(starterMonthly, starterYearly),
    [starterMonthly, starterYearly],
  );
  const proYearlySavings = useMemo(
    () => computeYearlySavings(proMonthly, proYearly),
    [proMonthly, proYearly],
  );
  const groupStarterYearlySavings = useMemo(
    () => computeYearlySavings(groupStarterMonthly, groupStarterYearly),
    [groupStarterMonthly, groupStarterYearly],
  );
  const groupProYearlySavings = useMemo(
    () => computeYearlySavings(groupProMonthly, groupProYearly),
    [groupProMonthly, groupProYearly],
  );
  const maxYearlySavingsPercent = useMemo(() => {
    const percents = [
      starterYearlySavings?.percent,
      proYearlySavings?.percent,
      groupStarterYearlySavings?.percent,
      groupProYearlySavings?.percent,
    ].filter((value): value is number => value != null && value > 0);
    return percents.length > 0 ? Math.max(...percents) : null;
  }, [
    groupProYearlySavings?.percent,
    groupStarterYearlySavings?.percent,
    proYearlySavings?.percent,
    starterYearlySavings?.percent,
  ]);

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
      const nextPlan = await purchasePackage(purchasePackageArg);
      if (nextPlan) {
        onPurchaseSuccess?.(nextPlan);
      }
    } catch {
      // Error state handled in context.
    }
  };

  useEffect(() => {
    if (
      !parentScrollRef ||
      !scrollContentRef ||
      scrollFocus === 'default' ||
      !isBillingReady ||
      isRefreshing
    ) {
      return;
    }

    const targetRef =
      scrollFocus === 'group'
        ? groupPlansSectionRef
        : scrollFocus === 'clinic'
          ? clinicPlansSectionRef
          : null;
    if (!targetRef) return;

    const timer = setTimeout(() => {
      scrollChildIntoScrollContent(parentScrollRef, scrollContentRef, targetRef);
    }, 350);

    return () => clearTimeout(timer);
  }, [isBillingReady, isRefreshing, parentScrollRef, scrollContentRef, scrollFocus]);

  if (!isBillingReady || isRefreshing) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator />
      </View>
    );
  }

  const currentPlan = billing?.plan ?? 'free';
  const recommendedUpgrade = getRecommendedUpgradePlan(
    currentPlan,
    isGroupFamily ? 'group' : 'clinic',
  );

  const starterPackage = billingCycle === 'monthly' ? starterMonthly : starterYearly;
  const proPackage = billingCycle === 'monthly' ? proMonthly : proYearly;
  const groupStarterPackage =
    billingCycle === 'monthly' ? groupStarterMonthly : groupStarterYearly;
  const groupProPackage = billingCycle === 'monthly' ? groupProMonthly : groupProYearly;

  const starterPrice =
    formatBillingPackagePrice(starterPackage, billingCycle) ??
    CLINIC_PLAN_MARKETING.starter.fallbackPriceLabel;
  const proPrice =
    formatBillingPackagePrice(proPackage, billingCycle) ??
    CLINIC_PLAN_MARKETING.pro.fallbackPriceLabel;
  const groupStarterPrice =
    formatBillingPackagePrice(groupStarterPackage, billingCycle) ??
    CLINIC_PLAN_MARKETING.group_starter.fallbackPriceLabel;
  const groupProPrice =
    formatBillingPackagePrice(groupProPackage, billingCycle) ??
    CLINIC_PLAN_MARKETING.group_pro.fallbackPriceLabel;

  const packageForPlan = (plan: BillingPlan): BillingPackage | undefined => {
    if (plan === 'starter') return starterPackage ?? starterMonthly ?? starterYearly;
    if (plan === 'pro') return proPackage ?? proMonthly ?? proYearly;
    if (plan === 'group_starter') {
      return groupStarterPackage ?? groupStarterMonthly ?? groupStarterYearly;
    }
    if (plan === 'group_pro') return groupProPackage ?? groupProMonthly ?? groupProYearly;
    return undefined;
  };

  const getRecommendedPackage = (plan: ClinicPlan): BillingPackage | undefined => {
    if (plan === 'starter' || plan === 'pro' || plan === 'group_starter' || plan === 'group_pro') {
      return packageForPlan(plan);
    }
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

  const scrollToGroupPlans = () => {
    if (parentScrollRef && scrollContentRef) {
      scrollChildIntoScrollContent(
        parentScrollRef,
        scrollContentRef,
        groupPlansSectionRef,
      );
      return;
    }
    scrollToComparePlans();
  };

  const isGroupUpgradePlan = (plan: ClinicPlan) =>
    plan === 'group_starter' || plan === 'group_pro';

  const isOnGroupPaidPlan = currentPlan === 'group_starter' || currentPlan === 'group_pro';
  const isOnClinicPaidPlan = currentPlan === 'starter' || currentPlan === 'pro';

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
              ? () => {
                  const pkg = getRecommendedPackage(recommendedUpgrade);
                  if (!pkg && isGroupUpgradePlan(recommendedUpgrade)) {
                    if (!hasGroupPackages) {
                      setLocalError(
                        'Group plans are not available for purchase yet. Check back after Group Starter and Group Pro are configured in the App Store and RevenueCat.',
                      );
                      return;
                    }
                    setLocalError(null);
                    scrollToGroupPlans();
                    return;
                  }
                  void handlePurchase(pkg);
                }
              : undefined
          }
          onComparePlans={scrollToComparePlans}
        />
      ) : null}

      <View ref={plansSectionRef} style={styles.compareSection}>
        <PlanComparisonIntro isGroupFamily={isGroupFamily} />

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

        {isGroupFamily && !hasGroupPackages ? (
          <Text style={[styles.notice, emphasizeGroupCaps && styles.noticeEmphasis]}>
            {emphasizeGroupCaps
              ? 'To add more locations or managers, you need Group Starter or Group Pro. Clinic Starter and Pro below unlock hiring tools only — not extra locations or managers.'
              : 'Group Starter and Group Pro will appear here once configured in App Store Connect and RevenueCat. Until then, Clinic Starter or Pro can unlock hiring tools — location and manager limits stay on your Free group trial.'}
          </Text>
        ) : null}

        {isPurchaseBillingAvailable && (hasClinicPackages || hasGroupPackages) ? (
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
            billingCycleLabel={
              isGroupFamily
                ? 'Includes 2 locations, 1 manager, and 1+1 posts'
                : 'Includes 1 active role and 1 active fill-in'
            }
            isCurrent={currentPlan === 'free'}
            actionLabel={currentPlan === 'free' ? 'Current plan' : 'Included with your account'}
            actionVariant="secondary"
            disabled
          />

          {isGroupFamily ? (
            <>
              <View ref={groupPlansSectionRef} collapsable={false}>
                <Text style={styles.sectionLabel}>Group plans — locations & managers</Text>
              </View>
              <PlanComparisonCard
                plan="group_starter"
                priceLabel={groupStarterPrice}
                billingCycleLabel={
                  hasGroupPackages
                    ? getBillingCycleLabel(billingCycle, groupStarterMonthly, groupStarterYearly)
                    : 'Coming soon'
                }
                yearlySavings={billingCycle === 'yearly' ? groupStarterYearlySavings : null}
                isCurrent={currentPlan === 'group_starter'}
                isRecommended={currentPlan === 'free'}
                actionLabel={
                  currentPlan === 'group_starter'
                    ? 'Current plan'
                    : currentPlan === 'group_pro'
                      ? 'Included in Group Pro'
                      : hasGroupPackages
                        ? 'Upgrade to Group Starter'
                        : 'Coming soon'
                }
                actionVariant={currentPlan === 'free' ? 'primary' : 'secondary'}
                disabled={
                  !isPurchaseBillingAvailable ||
                  !hasGroupPackages ||
                  currentPlan === 'group_starter' ||
                  currentPlan === 'group_pro' ||
                  isPurchasing
                }
                loading={isPurchasing}
                onPress={
                  isPurchaseBillingAvailable &&
                  hasGroupPackages &&
                  currentPlan === 'free'
                    ? () =>
                        void handlePurchase(
                          groupStarterPackage ?? groupStarterMonthly ?? groupStarterYearly,
                        )
                    : undefined
                }
              />

              <PlanComparisonCard
                plan="group_pro"
                priceLabel={groupProPrice}
                billingCycleLabel={
                  hasGroupPackages
                    ? getBillingCycleLabel(billingCycle, groupProMonthly, groupProYearly)
                    : 'Coming soon'
                }
                yearlySavings={billingCycle === 'yearly' ? groupProYearlySavings : null}
                isCurrent={currentPlan === 'group_pro'}
                isRecommended={currentPlan === 'group_starter'}
                actionLabel={
                  currentPlan === 'group_pro'
                    ? 'Current plan'
                    : hasGroupPackages
                      ? 'Upgrade to Group Pro'
                      : 'Coming soon'
                }
                actionVariant="primary"
                disabled={
                  !isPurchaseBillingAvailable ||
                  !hasGroupPackages ||
                  currentPlan === 'group_pro' ||
                  isPurchasing
                }
                loading={isPurchasing}
                onPress={
                  isPurchaseBillingAvailable &&
                  hasGroupPackages &&
                  currentPlan !== 'group_pro'
                    ? () =>
                        void handlePurchase(groupProPackage ?? groupProMonthly ?? groupProYearly)
                    : undefined
                }
              />

              <View ref={clinicPlansSectionRef} collapsable={false}>
                <Text style={styles.sectionLabel}>Clinic plans — hiring tools only</Text>
              </View>
            </>
          ) : null}

          <PlanComparisonCard
            plan="starter"
            priceLabel={starterPrice}
            billingCycleLabel={getBillingCycleLabel(billingCycle, starterMonthly, starterYearly)}
            yearlySavings={billingCycle === 'yearly' ? starterYearlySavings : null}
            isCurrent={currentPlan === 'starter'}
            isRecommended={!isGroupFamily && currentPlan === 'free'}
            actionLabel={
              currentPlan === 'starter'
                ? 'Current plan'
                : currentPlan === 'pro' || isOnGroupPaidPlan
                  ? 'Included in higher plan'
                  : 'Upgrade to Starter'
            }
            actionVariant={!isGroupFamily && currentPlan === 'free' ? 'primary' : 'secondary'}
            disabled={
              !isPurchaseBillingAvailable ||
              currentPlan === 'starter' ||
              currentPlan === 'pro' ||
              isOnGroupPaidPlan ||
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
            isRecommended={!isGroupFamily && currentPlan === 'starter'}
            actionLabel={
              currentPlan === 'pro'
                ? 'Current plan'
                : isOnGroupPaidPlan
                  ? 'Included in higher plan'
                  : 'Upgrade to Pro'
            }
            actionVariant="primary"
            disabled={
              !isPurchaseBillingAvailable ||
              currentPlan === 'pro' ||
              isOnGroupPaidPlan ||
              isPurchasing
            }
            loading={isPurchasing}
            onPress={
              isPurchaseBillingAvailable && !isOnClinicPaidPlan && !isOnGroupPaidPlan
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
