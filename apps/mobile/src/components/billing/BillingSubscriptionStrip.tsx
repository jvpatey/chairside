import type { ClinicSubscriptionStatus } from '@chairside/api';
import { StyleSheet, Text, View } from 'react-native';

import type { BillingCycle } from '@/lib/billingOfferings';
import {
  getSubscriptionFacts,
  getSubscriptionWarning,
} from '@/lib/clinicPlanPresentation';
import { useThemedStyles } from '@/theme';

type BillingSubscriptionStripProps = {
  status: ClinicSubscriptionStatus;
  currentPeriodEnd: string | null | undefined;
  billingCycle?: BillingCycle | null;
  priceLabel?: string | null;
  /** Slightly denser typography for compact / web layouts. */
  compact?: boolean;
};

export function BillingSubscriptionStrip({
  status,
  currentPeriodEnd,
  billingCycle = null,
  priceLabel = null,
  compact = false,
}: BillingSubscriptionStripProps) {
  const facts = getSubscriptionFacts({
    status,
    currentPeriodEnd,
    billingCycle,
    priceLabel,
  });
  const warning = getSubscriptionWarning(status);

  const styles = useThemedStyles(({ colors, spacing, typography, radii }) => ({
    wrap: {
      gap: compact ? spacing.sm : spacing.md,
      alignSelf: 'stretch' as const,
    },
    grid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      alignItems: 'stretch' as const,
      gap: compact ? spacing.sm : spacing.md,
    },
    fact: {
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: compact ? 140 : 108,
      minWidth: compact ? 128 : 100,
      paddingVertical: compact ? spacing.sm + 2 : spacing.md,
      paddingHorizontal: compact ? spacing.md : spacing.md,
      gap: 4,
      borderRadius: radii.md,
      backgroundColor: colors.backgroundGrouped,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
    },
    label: {
      ...typography.label,
      fontSize: 11,
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
      color: colors.labelTertiary,
    },
    value: {
      ...typography.title,
      fontSize: compact ? 16 : 18,
      lineHeight: compact ? 22 : 24,
      letterSpacing: -0.3,
      color: colors.labelPrimary,
    },
    warning: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
      color: colors.warning,
    },
  }));

  if (facts.length === 0 && !warning) return null;

  return (
    <View style={styles.wrap}>
      {facts.length > 0 ? (
        <View style={styles.grid}>
          {facts.map((fact) => (
            <View key={fact.label} style={styles.fact}>
              <Text style={styles.label}>{fact.label}</Text>
              <Text style={styles.value} numberOfLines={1}>
                {fact.value}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      {warning ? <Text style={styles.warning}>{warning}</Text> : null}
    </View>
  );
}
