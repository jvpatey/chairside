import type { JobMatchBreakdown, JobMatchContext } from '@chairside/core';
import { getMatchTierLabel } from '@chairside/core';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import { MatchDetailModal } from '@/components/matching/MatchDetailModal';
import { buildMatchDisplayContext } from '@/lib/matchDisplay';
import { getMatchTierPalette } from '@/lib/matchTierPalette';
import { useThemedStyles } from '@/theme';

type MatchTierBadgeProps = {
  breakdown: JobMatchBreakdown;
  context: Partial<JobMatchContext>;
  subtitle?: string;
  showProfileHint?: boolean;
};

export function MatchTierBadge({
  breakdown,
  context,
  subtitle,
  showProfileHint = false,
}: MatchTierBadgeProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const displayContext = buildMatchDisplayContext(context);

  const styles = useThemedStyles(({ colors, spacing }) => {
    const palette = getMatchTierPalette(breakdown.tier, colors);

    return {
      badge: {
        alignSelf: 'flex-start',
        borderRadius: 6,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        backgroundColor: palette.backgroundColor,
      },
      badgePressed: { opacity: 0.88 },
      label: {
        fontSize: 12,
        fontWeight: '600',
        color: palette.color,
      },
    };
  });

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${getMatchTierLabel(breakdown.tier)}. Tap for details.`}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setModalVisible(true);
        }}
        style={({ pressed }) => [styles.badge, pressed && styles.badgePressed]}>
        <Text style={styles.label}>{getMatchTierLabel(breakdown.tier)}</Text>
      </Pressable>
      <MatchDetailModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        breakdown={breakdown}
        context={displayContext}
        subtitle={subtitle}
        showProfileHint={showProfileHint}
      />
    </>
  );
}
