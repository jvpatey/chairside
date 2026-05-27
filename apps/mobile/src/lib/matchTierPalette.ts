import type { MatchTier } from '@chairside/core';
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
): string {
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
