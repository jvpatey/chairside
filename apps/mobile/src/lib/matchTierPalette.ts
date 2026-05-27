import type { MatchDetailAudience, MatchTier } from '@chairside/core';
import type { Colors } from '@/theme/colors';

type MatchTierPalette = {
  color: string;
  backgroundColor: string;
  borderColor: string;
  icon: 'checkmark-circle' | 'ellipse' | 'alert-circle' | 'close-circle';
};

export function getMatchTierPalette(tier: MatchTier, colors: Colors): MatchTierPalette {
  switch (tier) {
    case 'strong':
      return {
        color: colors.secondary,
        backgroundColor: colors.secondarySubtle,
        borderColor: colors.secondary,
        icon: 'checkmark-circle',
      };
    case 'good':
      return {
        color: colors.primary,
        backgroundColor: colors.primarySubtle,
        borderColor: colors.primary,
        icon: 'ellipse',
      };
    case 'partial':
      return {
        color: colors.warning,
        backgroundColor: colors.fillSubtle,
        borderColor: colors.warning,
        icon: 'alert-circle',
      };
    default:
      return {
        color: colors.destructive,
        backgroundColor: colors.fillSubtle,
        borderColor: colors.destructive,
        icon: 'close-circle',
      };
  }
}

export function getMatchTierSummaryHint(
  tier: MatchTier,
  strongCount: number,
  totalCount: number,
  audience: MatchDetailAudience = 'worker',
): string {
  if (audience === 'clinic') {
    switch (tier) {
      case 'strong':
        return strongCount === totalCount
          ? 'This applicant aligns well with your role on all criteria below.'
          : `This applicant aligns on ${strongCount} of ${totalCount} criteria — review details below.`;
      case 'good':
        return `Solid fit on ${strongCount} of ${totalCount} criteria — review any gaps below.`;
      case 'partial':
        return `Mixed fit on ${strongCount} of ${totalCount} criteria — review the gaps below.`;
      default:
        return 'This applicant does not meet key requirements for this role.';
    }
  }

  switch (tier) {
    case 'strong':
      return strongCount === totalCount
        ? `All ${totalCount} criteria align with this role`
        : `${strongCount} of ${totalCount} criteria fully align`;
    case 'good':
      return `${strongCount} of ${totalCount} criteria fully align`;
    case 'partial':
      return `${strongCount} of ${totalCount} criteria fully align`;
    default:
      return 'Key criteria do not align with this role';
  }
}
