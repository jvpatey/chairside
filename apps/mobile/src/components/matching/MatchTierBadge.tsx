import type { JobMatchBreakdown, JobMatchContext, MatchDetailAudience } from '@chairside/core';
import { getMatchTierLabel } from '@chairside/core';
import { useState } from 'react';

import { MatchDetailModal } from '@/components/matching/MatchDetailModal';
import { PillBadge } from '@/components/ui/PillBadge';
import { buildMatchDisplayContext } from '@/lib/matchDisplay';
import { getMatchTierPalette } from '@/lib/matchTierPalette';
import { useTheme } from '@/theme';

type MatchTierBadgeProps = {
  breakdown: JobMatchBreakdown;
  context: Partial<JobMatchContext>;
  subtitle?: string;
  showProfileHint?: boolean;
  audience?: MatchDetailAudience;
  /** Use a contrasting pill surface when the badge sits on a tinted row background. */
  onTintedSurface?: boolean;
};

export function MatchTierBadge({
  breakdown,
  context,
  subtitle,
  showProfileHint = false,
  audience = 'worker',
  onTintedSurface = false,
}: MatchTierBadgeProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const { colors } = useTheme();
  const displayContext = buildMatchDisplayContext(context);
  const palette = getMatchTierPalette(breakdown.tier, colors);
  const label = getMatchTierLabel(breakdown.tier);

  return (
    <>
      <PillBadge
        label={label}
        color={palette.color}
        backgroundColor={onTintedSurface ? colors.surface : palette.backgroundColor}
        borderColor={onTintedSurface ? palette.borderColor : undefined}
        accessibilityLabel={`${label}. Tap for details.`}
        onPress={() => setModalVisible(true)}
      />
      <MatchDetailModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        breakdown={breakdown}
        context={displayContext}
        subtitle={subtitle}
        showProfileHint={showProfileHint}
        audience={audience}
      />
    </>
  );
}
