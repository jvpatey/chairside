import { FILL_IN_PRICE_CAD } from '@chairside/config';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { ProfileSettingsCard } from '@/components/profile/ProfileSettingsCard';
import {
  getClinicPlanLabel,
  useClinicBilling,
} from '@/contexts/ClinicBillingContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useThemedStyles } from '@/theme';

/**
 * Fill-in pricing: a free allowance of fill-in posts (per location for groups), then one
 * credit per fill-in once it goes live. Credits are consumables bought through RevenueCat.
 * See supabase/migrations/144_fill_in_per_post_pricing.sql.
 */
export function ClinicBillingScreenContent() {
  const {
    billing,
    fillInPricing,
    fillInCreditPackage,
    refreshFillInPricing,
    purchaseFillInCredit,
    restorePurchases,
    manageSubscription,
    refreshBilling,
    isBillingReady,
    isPurchasing,
    isRestoring,
    isManagingSubscription,
    billingError,
    isPurchaseBillingAvailable,
    canManageSubscription,
  } = useClinicBilling();
  const { isOwner } = useClinicProfile();
  const [localError, setLocalError] = useState<string | null>(null);

  // Heal any RevenueCat / database desync for legacy subscriptions, and load credit state.
  useEffect(() => {
    void refreshBilling({ forceSubscriptionSync: true });
    void refreshFillInPricing();
  }, [refreshBilling, refreshFillInPricing]);

  const styles = useThemedStyles(({ colors, spacing, typography, radii }) => ({
    content: { gap: spacing.lg },
    body: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    statRow: {
      flexDirection: 'row' as const,
      gap: spacing.md,
    },
    stat: {
      flex: 1,
      gap: 2,
      padding: spacing.md,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
    },
    statLabel: {
      ...typography.label,
      fontSize: 12,
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
      color: colors.labelTertiary,
    },
    statValue: {
      ...typography.body,
      fontSize: 22,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
    },
    actions: { gap: spacing.sm },
    helper: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelTertiary,
    },
    loadingWrap: { alignItems: 'center' as const, paddingVertical: spacing.xl },
    actionLink: { alignSelf: 'center' as const, paddingVertical: spacing.sm },
    actionLinkText: { ...typography.body, fontWeight: '600' as const, color: colors.primary },
  }));

  if (!isBillingReady) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!isOwner) {
    return (
      <View style={styles.content}>
        <ProfileSettingsCard title="Fill-in posts">
          <Text style={styles.body}>
            Only the account owner can see fill-in credits and buy more.
          </Text>
        </ProfileSettingsCard>
      </View>
    );
  }

  const isGroupAccount = billing?.planFamily === 'group' || billing?.accountType === 'group';
  const perLocation = isGroupAccount ? ' per location' : '';
  const priceLabel = fillInCreditPackage?.priceLabel ?? `CA$${FILL_IN_PRICE_CAD}`;
  const legacyPlan =
    billing && billing.plan !== 'free' && billing.status !== 'expired' ? billing.plan : null;

  const handleBuyCredit = async () => {
    setLocalError(null);
    try {
      await purchaseFillInCredit();
    } catch {
      // Error state (other than cancel) is handled in the context.
    }
  };

  const handleRestore = () => {
    setLocalError(null);
    void restorePurchases().catch(() => {});
  };

  const handleManageSubscription = () => {
    setLocalError(null);
    void manageSubscription().catch(() => {});
  };

  const creditButtonLabel = isPurchasing ? 'Buying…' : `Buy 1 fill-in credit · ${priceLabel}`;

  return (
    <View style={styles.content}>
      <ProfileSettingsCard title="Fill-in posts">
        {fillInPricing ? (
          <>
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Free left</Text>
                <Text style={styles.statValue}>
                  {fillInPricing.freeRemaining} of {fillInPricing.freeAllowance}
                </Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Credits</Text>
                <Text style={styles.statValue}>{fillInPricing.creditBalance}</Text>
              </View>
            </View>
            <Text style={styles.body}>
              Your first {fillInPricing.freeAllowance} fill-in posts are free{perLocation}. After
              that, each fill-in costs {priceLabel}, charged when it goes live. Drafts are always
              free.
            </Text>
            <Text style={styles.body}>
              A credit is used when a fill-in goes live. Cancel within 15 minutes of going live and
              the credit returns to your balance. Credits are never refunded as cash.
            </Text>
            <View style={styles.actions}>
              <OnboardingButton
                label={creditButtonLabel}
                disabled={!isPurchaseBillingAvailable || !fillInCreditPackage || isPurchasing}
                onPress={() => void handleBuyCredit()}
              />
              {!isPurchaseBillingAvailable ? (
                <Text style={styles.helper}>
                  Credits can’t be bought on this device yet.
                </Text>
              ) : !fillInCreditPackage ? (
                <Text style={styles.helper}>
                  Credit pricing isn’t set up in the store yet. Check back soon.
                </Text>
              ) : null}
            </View>
          </>
        ) : (
          <View style={styles.actions}>
            <Text style={styles.body}>Could not load fill-in pricing.</Text>
            <OnboardingButton
              label="Try again"
              variant="secondary"
              onPress={() => void refreshFillInPricing()}
            />
          </View>
        )}
      </ProfileSettingsCard>

      {legacyPlan ? (
        <ProfileSettingsCard title="Subscription">
          <View style={styles.actions}>
            <Text style={styles.body}>
              You have an active {getClinicPlanLabel(legacyPlan)} subscription from before
              per-post pricing. It stays active until it ends. Fill-in posts are still charged per
              post.
            </Text>
            {canManageSubscription ? (
              <OnboardingButton
                label={isManagingSubscription ? 'Opening…' : 'Manage subscription'}
                variant="secondary"
                disabled={isManagingSubscription}
                onPress={handleManageSubscription}
              />
            ) : null}
          </View>
        </ProfileSettingsCard>
      ) : null}

      {isPurchaseBillingAvailable ? (
        <Pressable
          style={styles.actionLink}
          disabled={isRestoring}
          onPress={handleRestore}>
          <Text style={styles.actionLinkText}>
            {isRestoring ? 'Restoring…' : 'Restore purchases'}
          </Text>
        </Pressable>
      ) : null}

      <FormErrorBanner message={localError ?? billingError} />
    </View>
  );
}
