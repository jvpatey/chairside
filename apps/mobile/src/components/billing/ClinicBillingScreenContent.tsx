import {
  CLINIC_PLAN_MARKETING,
  type ClinicPlan,
} from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { PillBadge } from '@/components/ui/PillBadge';
import {
  getClinicPlanLabel,
  useClinicBilling,
} from '@/contexts/ClinicBillingContext';
import { CLINIC_PROFILE_BILLING } from '@/lib/routing';
import { colorWithAlpha, useTheme, useThemedStyles } from '@/theme';

type BillingCycle = 'monthly' | 'yearly';

type ClinicPlanCardProps = {
  plan: ClinicPlan;
  priceLabel: string;
  billingCycleLabel?: string | null;
  isCurrent: boolean;
  isRecommended?: boolean;
  actionLabel: string;
  actionVariant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
};

const PLAN_ICONS: Record<ClinicPlan, keyof typeof Ionicons.glyphMap> = {
  free: 'leaf-outline',
  starter: 'rocket-outline',
  pro: 'diamond-outline',
};

function ClinicPlanCard({
  plan,
  priceLabel,
  billingCycleLabel,
  isCurrent,
  isRecommended = false,
  actionLabel,
  actionVariant = 'primary',
  disabled = false,
  loading = false,
  onPress,
}: ClinicPlanCardProps) {
  const { colors, isDark } = useTheme();
  const marketing = CLINIC_PLAN_MARKETING[plan];
  const highlighted = isCurrent || (isRecommended && !isCurrent);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: highlighted ? 2 : 1,
      borderColor: isCurrent
        ? colors.primary
        : isRecommended
          ? colorWithAlpha(colors.primary, isDark ? 0.35 : 0.25)
          : colors.separator,
      padding: spacing.lg,
      gap: spacing.md,
    },
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      minHeight: 24,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isCurrent
        ? colorWithAlpha(colors.primary, isDark ? 0.18 : 0.1)
        : colors.fillSubtle,
    },
    headerText: {
      flex: 1,
      gap: spacing.xs,
    },
    title: {
      ...typography.body,
      fontWeight: '700',
      fontSize: 20,
      color: colors.labelPrimary,
    },
    tagline: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    priceBlock: {
      gap: 2,
    },
    price: {
      ...typography.body,
      fontWeight: '700',
      fontSize: 24,
      color: colors.labelPrimary,
    },
    priceMeta: {
      ...typography.subtitle,
      fontSize: 13,
      color: colors.labelTertiary,
    },
    features: {
      gap: spacing.sm,
      paddingTop: spacing.xs,
    },
    featureRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      alignItems: 'flex-start',
    },
    feature: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
      flex: 1,
    },
  }));

  return (
    <View style={styles.card}>
      <View style={styles.badgeRow}>
        {isCurrent ? (
          <PillBadge
            label="Current plan"
            color={colors.primaryOnPrimary}
            backgroundColor={colors.primary}
            size="sm"
          />
        ) : null}
        {isRecommended && !isCurrent ? (
          <PillBadge
            label="Recommended"
            color={colors.primary}
            backgroundColor={colorWithAlpha(colors.primary, isDark ? 0.18 : 0.1)}
            borderColor={colorWithAlpha(colors.primary, 0.25)}
            size="sm"
          />
        ) : null}
      </View>

      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons
            name={PLAN_ICONS[plan]}
            size={22}
            color={isCurrent || isRecommended ? colors.primary : colors.labelSecondary}
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{getClinicPlanLabel(plan)}</Text>
          <Text style={styles.tagline}>{marketing.tagline}</Text>
        </View>
      </View>

      <View style={styles.priceBlock}>
        <Text style={styles.price}>{priceLabel}</Text>
        {billingCycleLabel ? <Text style={styles.priceMeta}>{billingCycleLabel}</Text> : null}
      </View>

      <View style={styles.features}>
        {marketing.features.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={isCurrent || isRecommended ? colors.primary : colors.success}
              style={{ marginTop: 1 }}
            />
            <Text style={styles.feature}>{feature}</Text>
          </View>
        ))}
      </View>

      {onPress ? (
        <OnboardingButton
          label={loading ? 'Processing…' : actionLabel}
          variant={actionVariant}
          disabled={disabled || loading}
          onPress={onPress}
        />
      ) : (
        <OnboardingButton label={actionLabel} variant="secondary" disabled />
      )}
    </View>
  );
}

function BillingCycleToggle({
  value,
  onChange,
  hasMonthly,
  hasYearly,
}: {
  value: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
  hasMonthly: boolean;
  hasYearly: boolean;
}) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    row: {
      flexDirection: 'row',
      backgroundColor: colors.fillSubtle,
      borderRadius: 12,
      padding: 4,
      gap: 4,
    },
    option: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm,
      borderRadius: 10,
    },
    optionSelected: {
      backgroundColor: colors.surface,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
    label: {
      ...typography.body,
      fontSize: 14,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
    labelSelected: {
      color: colors.labelPrimary,
    },
  }));

  if (!hasMonthly && !hasYearly) return null;
  if (!hasMonthly || !hasYearly) return null;

  return (
    <View style={styles.row} accessibilityRole="tablist">
      {(['monthly', 'yearly'] as const).map((cycle) => {
        const selected = value === cycle;
        return (
          <Pressable
            key={cycle}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(cycle)}
            style={[styles.option, selected && styles.optionSelected]}>
            <Text style={[styles.label, selected && styles.labelSelected]}>
              {cycle === 'monthly' ? 'Monthly' : 'Yearly'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function UsageMeter({
  label,
  activeCount,
  activeLimit,
}: {
  label: string;
  activeCount: number;
  activeLimit: number;
}) {
  const { colors, isDark } = useTheme();
  const usageRatio = activeLimit <= 0 ? 0 : Math.min(1, activeCount / activeLimit);
  const atLimit = activeCount >= activeLimit;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    block: {
      gap: spacing.xs,
    },
    label: {
      ...typography.subtitle,
      fontSize: 13,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    meterTrack: {
      height: 8,
      borderRadius: 999,
      backgroundColor: colorWithAlpha(colors.primary, isDark ? 0.2 : 0.12),
      overflow: 'hidden',
    },
    meterFill: {
      height: '100%',
      borderRadius: 999,
      backgroundColor: atLimit ? colors.warning : colors.primary,
    },
    meterLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    meterMeta: {
      ...typography.subtitle,
      fontSize: 13,
      color: colors.labelSecondary,
    },
    meterMetaStrong: {
      fontWeight: '600',
      color: atLimit ? colors.warning : colors.labelPrimary,
    },
  }));

  return (
    <View style={styles.block}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.meterTrack}>
        <View
          style={[
            styles.meterFill,
            { width: `${Math.max(usageRatio * 100, activeCount > 0 ? 8 : 0)}%` },
          ]}
        />
      </View>
      <View style={styles.meterLabels}>
        <Text style={[styles.meterMeta, atLimit && styles.meterMetaStrong]}>
          {activeCount} of {activeLimit} used
        </Text>
        {atLimit ? (
          <Text style={[styles.meterMeta, styles.meterMetaStrong]}>At limit</Text>
        ) : (
          <Text style={styles.meterMeta}>{activeLimit - activeCount} remaining</Text>
        )}
      </View>
    </View>
  );
}

function UsageSummary({
  plan,
  activeRoleCount,
  activeRoleLimit,
  activeFillInCount,
  activeFillInLimit,
  activeCount,
  activeLimit,
  currentPeriodEnd,
}: {
  plan: ClinicPlan;
  activeRoleCount: number;
  activeRoleLimit: number | null | undefined;
  activeFillInCount: number;
  activeFillInLimit: number | null | undefined;
  activeCount: number;
  activeLimit: number | null | undefined;
  currentPeriodEnd: string | null | undefined;
}) {
  const { colors, isDark } = useTheme();
  const planLabel = getClinicPlanLabel(plan);
  const usesSeparatePostingLimits = plan === 'free' || plan === 'starter';
  const limitLabel =
    plan === 'free'
      ? '1 active role and 1 active fill-in'
      : plan === 'starter'
        ? '3 active roles and 3 active fill-ins'
        : activeLimit == null
          ? 'Unlimited active opportunities'
          : `${activeLimit} active ${activeLimit === 1 ? 'opportunity' : 'opportunities'}`;
  const usageRatio =
    activeLimit == null || activeLimit <= 0 ? 0 : Math.min(1, activeCount / activeLimit);
  const atLimit = activeLimit != null && activeCount >= activeLimit;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colorWithAlpha(colors.primary, isDark ? 0.12 : 0.06),
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colorWithAlpha(colors.primary, isDark ? 0.22 : 0.14),
      padding: spacing.lg,
      gap: spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    title: {
      ...typography.body,
      fontWeight: '700',
      fontSize: 17,
      color: colors.labelPrimary,
    },
    subtitle: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    meters: {
      gap: spacing.md,
    },
    meterTrack: {
      height: 8,
      borderRadius: 999,
      backgroundColor: colorWithAlpha(colors.primary, isDark ? 0.2 : 0.12),
      overflow: 'hidden',
    },
    meterFill: {
      height: '100%',
      borderRadius: 999,
      backgroundColor: atLimit ? colors.warning : colors.primary,
    },
    meterLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    meterLabel: {
      ...typography.subtitle,
      fontSize: 13,
      color: colors.labelSecondary,
    },
    meterLabelStrong: {
      fontWeight: '600',
      color: atLimit ? colors.warning : colors.labelPrimary,
    },
    renewal: {
      ...typography.subtitle,
      fontSize: 13,
      color: colors.labelTertiary,
    },
    meterBlock: {
      gap: spacing.xs,
    },
  }));

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.title}>Your plan</Text>
          <Text style={styles.subtitle}>
            {planLabel} · {limitLabel}
          </Text>
        </View>
        <PillBadge
          label={planLabel}
          color={colors.primary}
          backgroundColor={colorWithAlpha(colors.primary, isDark ? 0.18 : 0.1)}
          borderColor={colorWithAlpha(colors.primary, 0.25)}
          size="sm"
        />
      </View>

      {usesSeparatePostingLimits ? (
        <View style={styles.meters}>
          {activeRoleLimit != null ? (
            <UsageMeter
              label="Active roles"
              activeCount={activeRoleCount}
              activeLimit={activeRoleLimit}
            />
          ) : null}
          {activeFillInLimit != null ? (
            <UsageMeter
              label="Active fill-ins"
              activeCount={activeFillInCount}
              activeLimit={activeFillInLimit}
            />
          ) : null}
        </View>
      ) : activeLimit != null ? (
        <View style={styles.meterBlock}>
          <View style={styles.meterTrack}>
            <View
              style={[
                styles.meterFill,
                { width: `${Math.max(usageRatio * 100, activeCount > 0 ? 8 : 0)}%` },
              ]}
            />
          </View>
          <View style={styles.meterLabels}>
            <Text style={[styles.meterLabel, atLimit && styles.meterLabelStrong]}>
              {activeCount} of {activeLimit} used
            </Text>
            {atLimit ? (
              <Text style={[styles.meterLabel, styles.meterLabelStrong]}>At limit</Text>
            ) : (
              <Text style={styles.meterLabel}>{activeLimit - activeCount} remaining</Text>
            )}
          </View>
        </View>
      ) : (
        <Text style={styles.subtitle}>
          {activeCount} active {activeCount === 1 ? 'opportunity' : 'opportunities'} · no posting
          limit
        </Text>
      )}

      {currentPeriodEnd ? (
        <Text style={styles.renewal}>
          Renews or expires{' '}
          {new Date(currentPeriodEnd).toLocaleDateString(undefined, {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      ) : null}
    </View>
  );
}

function findPackage(
  packages: PurchasesPackage[] | undefined,
  identifiers: string[],
): PurchasesPackage | undefined {
  if (!packages?.length) return undefined;
  return packages.find(
    (pkg) => identifiers.includes(pkg.identifier) || identifiers.includes(pkg.product.identifier),
  );
}

function formatPackagePrice(pkg: PurchasesPackage | undefined, cycle: BillingCycle): string | null {
  if (!pkg) return null;
  const suffix = cycle === 'monthly' ? '/mo' : '/yr';
  return `${pkg.product.priceString}${suffix}`;
}

export function ClinicBillingScreenContent() {
  const {
    billing,
    offerings,
    purchasePackage,
    restorePurchases,
    isPurchasing,
    isRestoring,
    billingError,
    isNativeBillingAvailable,
    isBillingReady,
    isRefreshing,
  } = useClinicBilling();
  const [localError, setLocalError] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    content: { gap: spacing.lg },
    sectionTitle: {
      ...typography.body,
      fontWeight: '700',
      fontSize: 17,
      color: colors.labelPrimary,
    },
    helper: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelTertiary,
    },
    restore: { alignSelf: 'center', paddingVertical: spacing.sm },
    restoreText: { ...typography.body, fontWeight: '600', color: colors.primary },
    loadingWrap: { alignItems: 'center', paddingVertical: spacing.xl },
    planList: { gap: spacing.md },
  }));

  const currentPackages = useMemo(
    () => offerings?.current?.availablePackages ?? [],
    [offerings],
  );
  const starterMonthly = useMemo(
    () => findPackage(currentPackages, ['starter_monthly', 'clinic_starter_monthly', '$rc_monthly']),
    [currentPackages],
  );
  const starterYearly = useMemo(
    () => findPackage(currentPackages, ['starter_yearly', 'clinic_starter_yearly', '$rc_annual']),
    [currentPackages],
  );
  const proMonthly = useMemo(
    () => findPackage(currentPackages, ['pro_monthly', 'clinic_pro_monthly']),
    [currentPackages],
  );
  const proYearly = useMemo(
    () => findPackage(currentPackages, ['pro_yearly', 'clinic_pro_yearly']),
    [currentPackages],
  );

  const hasMonthly = Boolean(starterMonthly || proMonthly);
  const hasYearly = Boolean(starterYearly || proYearly);

  const handlePurchase = async (purchasePackageArg: PurchasesPackage | undefined) => {
    if (!purchasePackageArg) {
      setLocalError('This plan is not available yet in App Store Connect.');
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

  const starterPackage = billingCycle === 'monthly' ? starterMonthly : starterYearly;
  const proPackage = billingCycle === 'monthly' ? proMonthly : proYearly;

  const starterPrice =
    formatPackagePrice(starterPackage, billingCycle) ??
    CLINIC_PLAN_MARKETING.starter.fallbackPriceLabel;
  const proPrice =
    formatPackagePrice(proPackage, billingCycle) ??
    CLINIC_PLAN_MARKETING.pro.fallbackPriceLabel;

  return (
    <View style={styles.content}>
      <UsageSummary
        plan={currentPlan}
        activeRoleCount={billing?.activeRoleCount ?? 0}
        activeRoleLimit={billing?.activeRoleLimit}
        activeFillInCount={billing?.activeFillInCount ?? 0}
        activeFillInLimit={billing?.activeFillInLimit}
        activeCount={billing?.activeOpportunityCount ?? 0}
        activeLimit={billing?.activeOpportunityLimit}
        currentPeriodEnd={billing?.currentPeriodEnd}
      />

      <Text style={styles.sectionTitle}>Compare plans</Text>
      <Text style={styles.helper}>
        Workers stay free. Upgrade when you need more active postings, direct outreach, SMS alerts, or priority placement.
      </Text>

      {!isNativeBillingAvailable ? (
        <Text style={styles.helper}>
          In-app purchases require the native iOS app with App Store products configured. You can still review plans here.
        </Text>
      ) : null}

      {isNativeBillingAvailable ? (
        <BillingCycleToggle
          value={billingCycle}
          onChange={setBillingCycle}
          hasMonthly={hasMonthly}
          hasYearly={hasYearly}
        />
      ) : null}

      <View style={styles.planList}>
        <ClinicPlanCard
          plan="free"
          priceLabel={CLINIC_PLAN_MARKETING.free.fallbackPriceLabel}
          billingCycleLabel="Includes 1 active role and 1 active fill-in"
          isCurrent={currentPlan === 'free'}
          actionLabel={currentPlan === 'free' ? 'Current plan' : 'Included with your account'}
          actionVariant="secondary"
          disabled
        />

        <ClinicPlanCard
          plan="starter"
          priceLabel={starterPrice}
          billingCycleLabel={
            billingCycle === 'yearly' && starterYearly
              ? 'Billed annually'
              : billingCycle === 'monthly' && starterMonthly
                ? 'Billed monthly'
                : null
          }
          isCurrent={currentPlan === 'starter'}
          actionLabel={
            currentPlan === 'starter'
              ? 'Current plan'
              : currentPlan === 'pro'
                ? 'Included in Pro'
                : 'Upgrade to Starter'
          }
          actionVariant={currentPlan === 'free' ? 'primary' : 'secondary'}
          disabled={
            !isNativeBillingAvailable ||
            currentPlan === 'starter' ||
            currentPlan === 'pro' ||
            isPurchasing
          }
          loading={isPurchasing}
          onPress={
            isNativeBillingAvailable && currentPlan === 'free'
              ? () => void handlePurchase(starterPackage ?? starterMonthly ?? starterYearly)
              : undefined
          }
        />

        <ClinicPlanCard
          plan="pro"
          priceLabel={proPrice}
          billingCycleLabel={
            billingCycle === 'yearly' && proYearly
              ? 'Billed annually'
              : billingCycle === 'monthly' && proMonthly
                ? 'Billed monthly'
                : null
          }
          isCurrent={currentPlan === 'pro'}
          isRecommended={currentPlan !== 'pro'}
          actionLabel={currentPlan === 'pro' ? 'Current plan' : 'Upgrade to Pro'}
          actionVariant="primary"
          disabled={!isNativeBillingAvailable || currentPlan === 'pro' || isPurchasing}
          loading={isPurchasing}
          onPress={
            isNativeBillingAvailable && currentPlan !== 'pro'
              ? () => void handlePurchase(proPackage ?? proMonthly ?? proYearly)
              : undefined
          }
        />
      </View>

      {isNativeBillingAvailable ? (
        <Pressable
          style={styles.restore}
          disabled={isRestoring}
          onPress={() => {
            setLocalError(null);
            void restorePurchases().catch(() => {});
          }}>
          <Text style={styles.restoreText}>{isRestoring ? 'Restoring…' : 'Restore purchases'}</Text>
        </Pressable>
      ) : null}

      <FormErrorBanner message={localError ?? billingError} />
    </View>
  );
}

export function openClinicBillingScreen() {
  router.push(CLINIC_PROFILE_BILLING);
}
