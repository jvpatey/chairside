import { FILL_IN_PRICE_CAD } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { ProfileSettingsCard } from '@/components/profile/ProfileSettingsCard';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import {
  getClinicPlanLabel,
  useClinicBilling,
} from '@/contexts/ClinicBillingContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import {
  colorWithAlpha,
  fontBold,
  fontSemibold,
  getElevationStyle,
  getSpotlightGradient,
  useTheme,
  useThemedStyles,
} from '@/theme';

type PricingRuleItem = {
  icon: keyof typeof Ionicons.glyphMap;
  accent: 'tertiary' | 'primary' | 'warning';
  title: string;
  description: string;
};

/**
 * Fill-in pricing: a free allowance of fill-in posts (per location for groups), then one
 * credit per fill-in once it goes live. Credits are consumables bought through RevenueCat.
 * See supabase/migrations/144_fill_in_per_post_pricing.sql.
 */
export function ClinicBillingScreenContent() {
  const { colors, isDark } = useTheme();
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

  const styles = useThemedStyles(({ colors, spacing, typography, radii, isDark }) => ({
    content: { gap: spacing.lg },
    body: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    heroCard: {
      borderRadius: radii.lg,
      overflow: 'hidden' as const,
      borderWidth: 1,
      borderColor: colorWithAlpha(colors.primary, isDark ? 0.3 : 0.2),
      backgroundColor: colors.surface,
      ...getElevationStyle({ isDark, level: 'raised' }),
    },
    heroGradient: {
      padding: spacing.lg,
      gap: spacing.lg,
    },
    heroHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: spacing.sm,
      flexWrap: 'wrap' as const,
    },
    heroTitleGroup: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
      flexShrink: 1,
    },
    heroIconBadge: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colorWithAlpha(colors.primary, isDark ? 0.22 : 0.14),
    },
    heroTitle: {
      ...typography.body,
      fontSize: 16,
      fontWeight: '700' as const,
      fontFamily: fontBold,
      color: colors.labelPrimary,
    },
    statusPill: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radii.pill,
      borderWidth: StyleSheet.hairlineWidth,
    },
    statusPillReady: {
      backgroundColor: colorWithAlpha(colors.tertiary, isDark ? 0.18 : 0.12),
      borderColor: colorWithAlpha(colors.tertiary, isDark ? 0.4 : 0.28),
    },
    statusPillEmpty: {
      backgroundColor: colorWithAlpha(colors.warning, isDark ? 0.18 : 0.12),
      borderColor: colorWithAlpha(colors.warning, isDark ? 0.4 : 0.28),
    },
    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    statusPillText: {
      fontSize: 12,
      lineHeight: 15,
      fontWeight: '600' as const,
      fontFamily: fontSemibold,
    },
    statRow: {
      flexDirection: 'row' as const,
      gap: spacing.md,
    },
    statTile: {
      flex: 1,
      minWidth: 0,
      padding: spacing.md,
      borderRadius: radii.md,
      borderWidth: 1,
      gap: spacing.sm,
    },
    statTileFree: {
      backgroundColor: colorWithAlpha(colors.tertiary, isDark ? 0.11 : 0.07),
      borderColor: colorWithAlpha(colors.tertiary, isDark ? 0.28 : 0.22),
    },
    statTileCredits: {
      backgroundColor: colorWithAlpha(colors.primary, isDark ? 0.12 : 0.07),
      borderColor: colorWithAlpha(colors.primary, isDark ? 0.28 : 0.22),
    },
    statTopRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
    },
    statMiniIcon: {
      width: 22,
      height: 22,
      borderRadius: 7,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    statLabel: {
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '700' as const,
      fontFamily: fontBold,
      letterSpacing: 0.6,
      textTransform: 'uppercase' as const,
    },
    statValueRow: {
      flexDirection: 'row' as const,
      alignItems: 'baseline' as const,
      gap: 4,
    },
    statValue: {
      fontSize: 30,
      lineHeight: 34,
      fontWeight: '700' as const,
      fontFamily: fontBold,
      fontVariant: ['tabular-nums'] as ('tabular-nums')[],
      color: colors.labelPrimary,
    },
    statValueSuffix: {
      fontSize: 14,
      lineHeight: 18,
      fontWeight: '600' as const,
      fontFamily: fontSemibold,
      color: colors.labelSecondary,
    },
    statMeta: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.labelSecondary,
    },
    progressTrack: {
      height: 5,
      borderRadius: radii.pill,
      backgroundColor: colorWithAlpha(colors.tertiary, isDark ? 0.2 : 0.16),
      overflow: 'hidden' as const,
    },
    progressFill: {
      height: '100%' as const,
      borderRadius: radii.pill,
      backgroundColor: colors.tertiary,
    },
    purchaseSection: {
      gap: spacing.sm,
      paddingTop: spacing.xs,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colorWithAlpha(colors.primary, isDark ? 0.2 : 0.14),
    },
    priceCaptionRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingTop: spacing.xs,
    },
    priceCaptionLabel: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
    pricePill: {
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: radii.pill,
      backgroundColor: colorWithAlpha(colors.primary, isDark ? 0.2 : 0.12),
    },
    pricePillText: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '700' as const,
      fontFamily: fontBold,
      color: colors.primary,
    },
    infoBanner: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: radii.sm,
      backgroundColor: colors.fillSubtle,
    },
    infoBannerText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
    ruleList: {
      gap: spacing.md,
    },
    ruleRow: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: spacing.md,
    },
    ruleIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexShrink: 0,
      marginTop: 1,
    },
    ruleTextWrap: {
      flex: 1,
      gap: 2,
    },
    ruleTitle: {
      fontSize: 14,
      lineHeight: 19,
      fontWeight: '600' as const,
      fontFamily: fontSemibold,
      color: colors.labelPrimary,
    },
    ruleDescription: {
      fontSize: 13,
      lineHeight: 19,
      color: colors.labelSecondary,
    },
    legacyBadge: {
      alignSelf: 'flex-start' as const,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radii.pill,
      backgroundColor: colorWithAlpha(colors.primary, isDark ? 0.2 : 0.12),
    },
    legacyBadgeText: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '600' as const,
      fontFamily: fontSemibold,
      color: colors.primary,
    },
    emptyState: {
      alignItems: 'center' as const,
      gap: spacing.md,
      paddingVertical: spacing.sm,
    },
    emptyIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colorWithAlpha(colors.warning, isDark ? 0.18 : 0.12),
    },
    emptyTitle: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '600' as const,
      fontFamily: fontSemibold,
      color: colors.labelPrimary,
      textAlign: 'center' as const,
    },
    emptySubtitle: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
      textAlign: 'center' as const,
    },
    ownerNoticeRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.md,
    },
    ownerNoticeIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colorWithAlpha(colors.primary, isDark ? 0.18 : 0.12),
    },
    ownerNoticeText: {
      flex: 1,
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    actions: { gap: spacing.sm },
    loadingWrap: { alignItems: 'center' as const, paddingVertical: spacing.xl },
    actionLink: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 6,
      alignSelf: 'center' as const,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    actionLinkText: {
      ...typography.body,
      fontSize: 14,
      fontWeight: '600' as const,
      fontFamily: fontSemibold,
      color: colors.primary,
    },
  }));

  if (!isBillingReady) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!isOwner) {
    return (
      <View style={styles.content}>
        <ProfileSettingsCard title="Fill-in posts">
          <View style={styles.ownerNoticeRow}>
            <View style={styles.ownerNoticeIcon}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.ownerNoticeText}>
              Only the account owner can view fill-in credits and buy more.
            </Text>
          </View>
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
  const spotlightColors = getSpotlightGradient(colors, isDark, 'primary');

  const freeProgressPct =
    fillInPricing && fillInPricing.freeAllowance > 0
      ? Math.max(0, Math.min(100, (fillInPricing.freeRemaining / fillInPricing.freeAllowance) * 100))
      : 0;

  const statusText = fillInPricing
    ? fillInPricing.freeRemaining > 0
      ? 'Free posts available'
      : fillInPricing.creditBalance > 0
        ? 'Ready to post'
        : 'Credit needed'
    : '';

  const pricingRules: PricingRuleItem[] = [
    {
      icon: 'sparkles-outline',
      accent: 'tertiary',
      title: 'Free to get started',
      description: `Your first ${fillInPricing?.freeAllowance ?? 2} fill-in posts are free${perLocation}. Drafts are always free.`,
    },
    {
      icon: 'flash-outline',
      accent: 'primary',
      title: 'Pay only when a shift goes live',
      description: `After your free posts, each fill-in uses 1 credit (${priceLabel}) when published. Edits never charge.`,
    },
    {
      icon: 'refresh-outline',
      accent: 'warning',
      title: '15-minute grace refund',
      description:
        'Cancel within 15 minutes of going live and your credit returns to your balance. Credits are never refunded as cash.',
    },
  ];

  const getRuleAccentColors = (accent: PricingRuleItem['accent']) => {
    const base =
      accent === 'tertiary'
        ? colors.tertiary
        : accent === 'warning'
          ? colors.warning
          : colors.primary;
    return {
      fg: base,
      bg: colorWithAlpha(base, isDark ? 0.18 : 0.12),
    };
  };

  return (
    <View style={styles.content}>
      {fillInPricing ? (
        <View style={styles.heroCard}>
          <LinearGradient
            colors={spotlightColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}>
            <View style={styles.heroHeader}>
              <View style={styles.heroTitleGroup}>
                <View style={styles.heroIconBadge}>
                  <Ionicons name="wallet-outline" size={18} color={colors.primary} />
                </View>
                <Text style={styles.heroTitle}>Fill-in balance</Text>
              </View>
              <View
                style={[
                  styles.statusPill,
                  fillInPricing.canPublishFillIn ? styles.statusPillReady : styles.statusPillEmpty,
                ]}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: fillInPricing.canPublishFillIn
                        ? colors.tertiary
                        : colors.warning,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.statusPillText,
                    {
                      color: fillInPricing.canPublishFillIn ? colors.tertiary : colors.warning,
                    },
                  ]}>
                  {statusText}
                </Text>
              </View>
            </View>

            <View style={styles.statRow}>
              <View style={[styles.statTile, styles.statTileFree]}>
                <View style={styles.statTopRow}>
                  <View
                    style={[
                      styles.statMiniIcon,
                      { backgroundColor: colorWithAlpha(colors.tertiary, isDark ? 0.24 : 0.16) },
                    ]}>
                    <Ionicons name="gift-outline" size={13} color={colors.tertiary} />
                  </View>
                  <Text style={[styles.statLabel, { color: colors.tertiary }]}>Free posts</Text>
                </View>
                <View style={styles.statValueRow}>
                  <Text style={styles.statValue}>{fillInPricing.freeRemaining}</Text>
                  <Text style={styles.statValueSuffix}>of {fillInPricing.freeAllowance}</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${freeProgressPct}%` }]} />
                </View>
              </View>

              <View style={[styles.statTile, styles.statTileCredits]}>
                <View style={styles.statTopRow}>
                  <View
                    style={[
                      styles.statMiniIcon,
                      { backgroundColor: colorWithAlpha(colors.primary, isDark ? 0.24 : 0.16) },
                    ]}>
                    <Ionicons name="ticket-outline" size={13} color={colors.primary} />
                  </View>
                  <Text style={[styles.statLabel, { color: colors.primary }]}>Credits</Text>
                </View>
                <View style={styles.statValueRow}>
                  <Text style={styles.statValue}>{fillInPricing.creditBalance}</Text>
                </View>
                <Text style={styles.statMeta}>1 credit = 1 live post</Text>
              </View>
            </View>

            <View style={styles.purchaseSection}>
              <View style={styles.priceCaptionRow}>
                <Text style={styles.priceCaptionLabel}>Pay-as-you-go fill-in credit</Text>
                <View style={styles.pricePill}>
                  <Text style={styles.pricePillText}>{priceLabel} each</Text>
                </View>
              </View>
              <OnboardingButton
                label={creditButtonLabel}
                disabled={!isPurchaseBillingAvailable || !fillInCreditPackage || isPurchasing}
                onPress={() => void handleBuyCredit()}
              />
              {!isPurchaseBillingAvailable ? (
                <View style={styles.infoBanner}>
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color={colors.labelSecondary}
                  />
                  <Text style={styles.infoBannerText}>
                    Credits can’t be bought on this device yet.
                  </Text>
                </View>
              ) : !fillInCreditPackage ? (
                <View style={styles.infoBanner}>
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color={colors.labelSecondary}
                  />
                  <Text style={styles.infoBannerText}>
                    Credit pricing isn’t set up in the store yet. Check back soon.
                  </Text>
                </View>
              ) : null}
            </View>
          </LinearGradient>
        </View>
      ) : (
        <ProfileSettingsCard title="Fill-in posts">
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="cloud-offline-outline" size={22} color={colors.warning} />
            </View>
            <View style={{ gap: 4 }}>
              <Text style={styles.emptyTitle}>Could not load fill-in pricing</Text>
              <Text style={styles.emptySubtitle}>
                Check your connection and try again to see your balance.
              </Text>
            </View>
            <OnboardingButton
              label="Try again"
              variant="secondary"
              onPress={() => void refreshFillInPricing()}
            />
          </View>
        </ProfileSettingsCard>
      )}

      <ProfileSettingsCard title="How pricing works">
        <View style={styles.ruleList}>
          {pricingRules.map((rule) => {
            const accent = getRuleAccentColors(rule.accent);
            return (
              <View key={rule.title} style={styles.ruleRow}>
                <View style={[styles.ruleIconWrap, { backgroundColor: accent.bg }]}>
                  <Ionicons name={rule.icon} size={17} color={accent.fg} />
                </View>
                <View style={styles.ruleTextWrap}>
                  <Text style={styles.ruleTitle}>{rule.title}</Text>
                  <Text style={styles.ruleDescription}>{rule.description}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ProfileSettingsCard>

      {legacyPlan ? (
        <ProfileSettingsCard title="Subscription">
          <View style={styles.actions}>
            <View style={styles.legacyBadge}>
              <Ionicons name="ribbon-outline" size={14} color={colors.primary} />
              <Text style={styles.legacyBadgeText}>{getClinicPlanLabel(legacyPlan)} plan</Text>
            </View>
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
          <Ionicons name="refresh-outline" size={15} color={colors.primary} />
          <Text style={styles.actionLinkText}>
            {isRestoring ? 'Restoring…' : 'Restore purchases'}
          </Text>
        </Pressable>
      ) : null}

      <FormErrorBanner message={localError ?? billingError} />
    </View>
  );
}
