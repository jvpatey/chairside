import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { WelcomeHeroFillInCard } from '@/components/onboarding/WelcomeHeroFillInCard.web';
import {
  getWelcomeHeroPreview,
  type WelcomeHeroPreview,
} from '@/lib/welcomeHeroPreview';
import { useThemedStyles } from '@/theme';

type WelcomeHeroClinicCanvasProps = {
  compact?: boolean;
  preview?: WelcomeHeroPreview;
};

export function WelcomeHeroClinicCanvas({
  compact = false,
  preview: previewProp,
}: WelcomeHeroClinicCanvasProps) {
  const preview = useMemo(() => previewProp ?? getWelcomeHeroPreview(), [previewProp]);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    root: {
      flex: compact ? 1 : undefined,
      alignSelf: 'stretch' as const,
      minWidth: 0,
      minHeight: compact ? 0 : undefined,
      backgroundColor: colors.backgroundGrouped,
      padding: compact ? spacing.sm : spacing.md,
      gap: compact ? spacing.sm : spacing.md,
    },
    header: {
      gap: 2,
    },
    eyebrow: {
      fontSize: 12,
      fontWeight: '600' as const,
      letterSpacing: 0.4,
      textTransform: 'uppercase' as const,
      color: colors.secondary,
    },
    title: {
      fontSize: compact ? 16 : 18,
      fontWeight: '700' as const,
      letterSpacing: -0.3,
      color: colors.labelPrimary,
    },
  }));

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Fill-ins</Text>
        <Text style={styles.title}>Same-day coverage</Text>
      </View>
      <WelcomeHeroFillInCard preview={preview} embedded />
    </View>
  );
}
