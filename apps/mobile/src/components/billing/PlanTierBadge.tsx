import { type ClinicPlan } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';

import { PillBadge } from '@/components/ui/PillBadge';
import {
  CLINIC_PLAN_ICONS,
  getClinicPlanTierLabel,
} from '@/lib/clinicPlanPresentation';
import { colorWithAlpha, useTheme } from '@/theme';

type PlanTierBadgeProps = {
  plan: ClinicPlan;
  size?: 'sm' | 'md';
};

export function PlanTierBadge({ plan, size = 'md' }: PlanTierBadgeProps) {
  const { colors, isDark } = useTheme();

  const accent =
    plan === 'pro' ? colors.primary : plan === 'starter' ? colors.secondary : colors.labelSecondary;

  return (
    <PillBadge
      label={getClinicPlanTierLabel(plan)}
      color={accent}
      backgroundColor={colorWithAlpha(accent, isDark ? 0.2 : 0.12)}
      borderColor={colorWithAlpha(accent, 0.28)}
      size={size}
      leading={
        <Ionicons
          name={CLINIC_PLAN_ICONS[plan]}
          size={size === 'sm' ? 13 : 14}
          color={accent}
        />
      }
    />
  );
}
