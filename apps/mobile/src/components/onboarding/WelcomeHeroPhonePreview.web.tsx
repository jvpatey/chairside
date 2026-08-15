import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { FillInListingCard } from '@/components/worker/FillInListingCard';
import { FILL_IN_ICON } from '@/lib/fillInIcons';
import { webOnlyStyle } from '@/lib/webPressableStyles';
import { type WelcomeHeroPreview } from '@/lib/welcomeHeroPreview';
import { fontSemibold, useTheme, useThemedStyles } from '@/theme';
import { getWebShadow } from '@/theme/web';

type WelcomeHeroPhonePreviewProps = {
  preview: WelcomeHeroPreview;
  compact?: boolean;
};

const PHONE_WIDTH = 390;
const PHONE_HEIGHT = 760;
const LANDING_SCALE = 0.5;
const COMPACT_SCALE = 0.4;

function formatStatusTime(date = new Date()) {
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function WelcomeHeroPhonePreview({
  preview,
  compact = false,
}: WelcomeHeroPhonePreviewProps) {
  const { colors } = useTheme();
  const scale = compact ? COMPACT_SCALE : LANDING_SCALE;
  const frameWidth = PHONE_WIDTH * scale;
  const frameHeight = PHONE_HEIGHT * scale;

  const styles = useThemedStyles(({ colors, spacing, isDark: dark }) => ({
    frame: {
      overflow: 'visible' as const,
      borderRadius: 44 * scale,
      ...webOnlyStyle({
        boxShadow: getWebShadow(dark, 'floating'),
      } as object),
    },
    clip: {
      width: '100%' as const,
      height: '100%' as const,
      borderRadius: 44 * scale,
      overflow: 'hidden' as const,
      ...webOnlyStyle({
        clipPath: `inset(0 round ${44 * scale}px)`,
      } as object),
    },
    scaled: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: PHONE_WIDTH,
      height: PHONE_HEIGHT,
    },
    device: {
      flex: 1,
      borderRadius: 44,
      padding: 12,
      backgroundColor: dark ? '#0B0D12' : '#1C1C1E',
    },
    screen: {
      flex: 1,
      borderRadius: 34,
      overflow: 'hidden' as const,
      backgroundColor: colors.backgroundGrouped,
      position: 'relative' as const,
      ...webOnlyStyle({
        clipPath: 'inset(0 round 34px)',
      } as object),
    },
    statusBar: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: spacing.md + 4,
      paddingTop: 14,
      height: 54,
    },
    statusTime: {
      fontSize: 15,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
    },
    islandWrap: {
      position: 'absolute' as const,
      top: 11,
      left: 0,
      right: 0,
      alignItems: 'center' as const,
      zIndex: 2,
      pointerEvents: 'none' as const,
    },
    island: {
      width: 126,
      height: 36,
      borderRadius: 999,
      backgroundColor: dark ? '#0B0D12' : '#1C1C1E',
    },
    statusIcons: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
    },
    body: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      gap: spacing.lg,
      minHeight: 0,
    },
    chip: {
      alignSelf: 'flex-start' as const,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.xs,
      paddingVertical: 6,
      paddingHorizontal: spacing.sm,
      borderRadius: 999,
      backgroundColor: colors.secondarySubtle,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    chipText: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: colors.secondary,
    },
    title: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '700' as const,
      letterSpacing: -0.4,
      color: colors.labelPrimary,
    },
    subtitle: {
      fontSize: 15,
      lineHeight: 21,
      color: colors.labelSecondary,
      marginTop: 2,
    },
    headerBlock: {
      gap: spacing.sm,
    },
    cardStack: {
      gap: spacing.md,
    },
    homeIndicator: {
      alignSelf: 'center' as const,
      width: 134,
      height: 5,
      borderRadius: 999,
      backgroundColor: colors.labelTertiary,
      opacity: 0.4,
      marginBottom: 8,
      marginTop: spacing.sm,
    },
  }));

  return (
    <View
      style={[styles.frame, { width: frameWidth, height: frameHeight }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.clip}>
        <View
          style={[
            styles.scaled,
            {
              transform: [
                { translateX: -((PHONE_WIDTH - frameWidth) / 2) },
                { translateY: -((PHONE_HEIGHT - frameHeight) / 2) },
                { scale },
              ],
            },
          ]}
        >
          <View style={styles.device}>
            <View style={styles.screen}>
              <View style={styles.islandWrap}>
                <View style={styles.island} />
              </View>
              <View style={styles.statusBar}>
                <Text style={styles.statusTime}>{formatStatusTime()}</Text>
                <View style={styles.statusIcons}>
                  <Ionicons name="cellular" size={15} color={colors.labelPrimary} />
                  <Ionicons name="wifi" size={15} color={colors.labelPrimary} />
                  <Ionicons name="battery-full" size={18} color={colors.labelPrimary} />
                </View>
              </View>

              <View style={styles.body}>
                <View style={styles.headerBlock}>
                  <View style={styles.chip}>
                    <Ionicons name={FILL_IN_ICON.outline} size={14} color={colors.secondary} />
                    <Text style={styles.chipText}>New fill-in nearby</Text>
                  </View>
                  <View>
                    <Text style={styles.title}>Cover today?</Text>
                    <Text style={styles.subtitle}>
                      A clinic needs a hygienist — request to cover in one tap.
                    </Text>
                  </View>
                </View>

                <View style={styles.cardStack}>
                  <FillInListingCard
                    shift={preview.shift}
                    distanceLabel={preview.fillInDistanceLabel}
                    accent="secondary"
                    embedded
                  />
                  <OnboardingButton
                    label="Request to cover"
                    accent="secondary"
                    onPress={() => {}}
                  />
                </View>
              </View>

              <View style={styles.homeIndicator} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
