import { type ClinicPlan } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';

import { PillBadge } from '@/components/ui/PillBadge';
import {
  CLINIC_PLAN_ICONS,
  getClinicPlanBrandAccentColor,
  getClinicPlanSubtleBackground,
  getClinicPlanTierLabel,
} from '@/lib/clinicPlanPresentation';
import { colorWithAlpha, useTheme } from '@/theme';

type PlanTierBadgeProps = {
  plan: ClinicPlan;
  size?: 'sm' | 'md';
};

export function PlanTierBadge({ plan, size = 'md' }: PlanTierBadgeProps) {
  const { colors } = useTheme();
  const accent = getClinicPlanBrandAccentColor(plan, colors);
  const backgroundColor = getClinicPlanSubtleBackground(plan, colors);

  return (
    <PillBadge
      label={getClinicPlanTierLabel(plan)}
      color={accent}
      backgroundColor={backgroundColor}
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
