import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { WelcomeHeroFillInCard } from '@/components/onboarding/WelcomeHeroFillInCard.web';
import {
  heroPhaseAtLeast,
  type HeroDemoPhase,
} from '@/components/onboarding/welcomeHeroDemo';
import {
  getWelcomeHeroPreview,
  type WelcomeHeroPreview,
} from '@/lib/welcomeHeroPreview';
import { webOnlyStyle } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';
import { webMotion } from '@/theme/web';

type WelcomeHeroClinicCanvasProps = {
  compact?: boolean;
  preview?: WelcomeHeroPreview;
  /** When provided, visibility is driven by the hero demo loop. */
  demoPhase?: HeroDemoPhase;
};

const ENTER = `opacity 520ms ${webMotion.easingOut}, transform 520ms ${webMotion.easingOut}`;

export function WelcomeHeroClinicCanvas({
  compact = false,
  preview: previewProp,
  demoPhase,
}: WelcomeHeroClinicCanvasProps) {
  const preview = useMemo(() => previewProp ?? getWelcomeHeroPreview(), [previewProp]);
  const reducedMotion = useReducedMotion();
  const [legacyCovered, setLegacyCovered] = useState(reducedMotion);

  useEffect(() => {
    if (demoPhase != null) return;
    if (reducedMotion) {
      setLegacyCovered(true);
      return;
    }
    const timer = setTimeout(() => setLegacyCovered(true), 900);
    return () => clearTimeout(timer);
  }, [demoPhase, reducedMotion]);

  const showCard = demoPhase == null || heroPhaseAtLeast(demoPhase, 'post');
  const showCovered =
    demoPhase == null
      ? legacyCovered
      : demoPhase === 'covered' || demoPhase === 'idle';

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
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      justifyContent: 'space-between' as const,
      gap: spacing.sm,
      minHeight: 36,
    },
    headerCopy: {
      gap: 2,
      flex: 1,
      minWidth: 0,
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
    covered: {
      flexShrink: 0,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 999,
      backgroundColor: colors.tertiarySubtle,
      borderWidth: 1,
      borderColor: colors.tertiary,
    },
    coveredText: {
      fontSize: 12,
      fontWeight: '700' as const,
      color: colors.tertiary,
    },
  }));

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>Fill-ins</Text>
          <Text style={styles.title}>Same-day coverage</Text>
        </View>
        <View
          style={[
            styles.covered,
            webOnlyStyle({
              opacity: showCovered ? 1 : 0,
              transform: [
                { scale: showCovered ? 1 : 0.88 },
                { translateY: showCovered ? 0 : -4 },
              ],
              transition: ENTER,
              pointerEvents: 'none',
            } as object),
          ]}
        >
          <Text style={styles.coveredText}>Fill-in confirmed</Text>
        </View>
      </View>
      <View
        style={webOnlyStyle({
          opacity: showCard ? 1 : 0,
          transform: [
            { translateY: showCard ? 0 : 18 },
            { scale: showCard ? 1 : 0.98 },
          ],
          transition: ENTER,
        } as object)}
      >
        <WelcomeHeroFillInCard preview={preview} embedded demoPhase={demoPhase} />
      </View>
    </View>
  );
}
