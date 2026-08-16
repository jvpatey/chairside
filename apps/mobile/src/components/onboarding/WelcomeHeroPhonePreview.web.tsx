import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { type HeroDemoPhase } from '@/components/onboarding/welcomeHeroDemo';
import { FILL_IN_ICON } from '@/lib/fillInIcons';
import { webOnlyStyle } from '@/lib/webPressableStyles';
import { type WelcomeHeroPreview } from '@/lib/welcomeHeroPreview';
import { fontSemibold, useTheme, useThemedStyles } from '@/theme';
import { getWebShadow, webMotion } from '@/theme/web';

type WelcomeHeroPhonePreviewProps = {
  preview: WelcomeHeroPreview;
  compact?: boolean;
  /** When provided, the push banner + request/confirm CTA are driven by the hero demo loop. */
  demoPhase?: HeroDemoPhase;
};

const PHONE_WIDTH = 390;
const PHONE_HEIGHT = 760;
const LANDING_SCALE = 0.5;
const COMPACT_SCALE = 0.4;

function formatStatusTime(date = new Date()) {
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function phaseStyle(visible: boolean, offsetY = 10, delayMs = 0) {
  const delay = delayMs > 0 ? ` ${delayMs}ms` : '';
  return webOnlyStyle({
    opacity: visible ? 1 : 0,
    transform: [{ translateY: visible ? 0 : offsetY }, { scale: visible ? 1 : 0.97 }],
    transition: `opacity 520ms ${webMotion.easingOut}${delay}, transform 520ms ${webMotion.easingOut}${delay}`,
    pointerEvents: visible ? 'auto' : 'none',
  } as object);
}

export function WelcomeHeroPhonePreview({
  preview,
  compact = false,
  demoPhase,
}: WelcomeHeroPhonePreviewProps) {
  const { colors } = useTheme();
  const scale = compact ? COMPACT_SCALE : LANDING_SCALE;
  const frameWidth = PHONE_WIDTH * scale;
  const frameHeight = PHONE_HEIGHT * scale;

  const showNewBanner = demoPhase === 'alert';
  const showConfirmedBanner =
    demoPhase == null || demoPhase === 'covered' || demoPhase === 'idle';
  const showRequestCard = demoPhase === 'alert';
  const showConfirmedCard =
    demoPhase == null || demoPhase === 'covered' || demoPhase === 'idle';

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
      paddingTop: spacing.xl,
      minHeight: 0,
      justifyContent: 'center' as const,
    },
    cardStage: {
      position: 'relative' as const,
      minHeight: 148,
    },
    cardLayer: {
      width: '100%' as const,
    },
    cardLayerAbsolute: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
    },
    fillInChip: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      gap: spacing.sm,
      ...webOnlyStyle({
        boxShadow: getWebShadow(dark, 'subtle'),
      } as object),
    },
    confirmedChip: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.tertiary,
      padding: spacing.md,
      gap: spacing.sm,
      ...webOnlyStyle({
        boxShadow: getWebShadow(dark, 'subtle'),
      } as object),
    },
    chipHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.secondarySubtle,
    },
    confirmedIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.tertiary,
    },
    chipCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    chipTitle: {
      fontSize: 15,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
    },
    confirmedTitle: {
      fontSize: 15,
      fontWeight: '700' as const,
      color: colors.tertiary,
    },
    chipMeta: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
    distance: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: colors.secondary,
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
    banner: {
      position: 'absolute' as const,
      top: 58,
      left: 10,
      right: 10,
      zIndex: 3,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
      paddingVertical: 10,
      paddingHorizontal: spacing.sm + 2,
      borderRadius: 18,
      backgroundColor: dark ? 'rgba(44,44,48,0.94)' : 'rgba(250,250,252,0.96)',
      borderWidth: 1,
      borderColor: colors.separator,
      ...webOnlyStyle({
        boxShadow: getWebShadow(dark, 'raised'),
        backdropFilter: 'blur(16px)',
      } as object),
    },
    bannerIcon: {
      width: 34,
      height: 34,
      borderRadius: 9,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.secondary,
    },
    bannerIconConfirmed: {
      width: 34,
      height: 34,
      borderRadius: 9,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.tertiary,
    },
    bannerBody: {
      flex: 1,
      minWidth: 0,
      gap: 1,
    },
    bannerTitleRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: spacing.xs,
    },
    bannerApp: {
      fontSize: 13,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
    },
    bannerTime: {
      fontSize: 11,
      color: colors.labelTertiary,
    },
    bannerText: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.labelSecondary,
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
              {demoPhase != null ? (
                <>
                  <View style={[styles.banner, phaseStyle(showNewBanner, -72)]}>
                    <View style={styles.bannerIcon}>
                      <Ionicons name={FILL_IN_ICON.filled} size={18} color="#FFFFFF" />
                    </View>
                    <View style={styles.bannerBody}>
                      <View style={styles.bannerTitleRow}>
                        <Text style={styles.bannerApp}>Chairside</Text>
                        <Text style={styles.bannerTime}>now</Text>
                      </View>
                      <Text style={styles.bannerText} numberOfLines={2}>
                        New fill-in nearby — Dental Hygienist · Today 9–5
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.banner, phaseStyle(showConfirmedBanner, -72)]}>
                    <View style={styles.bannerIconConfirmed}>
                      <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    </View>
                    <View style={styles.bannerBody}>
                      <View style={styles.bannerTitleRow}>
                        <Text style={styles.bannerApp}>Chairside</Text>
                        <Text style={styles.bannerTime}>now</Text>
                      </View>
                      <Text style={styles.bannerText} numberOfLines={2}>
                        Fill-in confirmed — you’re covering Today · 9–5
                      </Text>
                    </View>
                  </View>
                </>
              ) : null}
              <View style={styles.statusBar}>
                <Text style={styles.statusTime}>{formatStatusTime()}</Text>
                <View style={styles.statusIcons}>
                  <Ionicons name="cellular" size={15} color={colors.labelPrimary} />
                  <Ionicons name="wifi" size={15} color={colors.labelPrimary} />
                  <Ionicons name="battery-full" size={18} color={colors.labelPrimary} />
                </View>
              </View>

              <View style={styles.body}>
                <View style={styles.cardStage}>
                  <View
                    style={[
                      styles.cardLayer,
                      styles.cardLayerAbsolute,
                      phaseStyle(showRequestCard, 16, 80),
                    ]}
                  >
                    <View style={styles.fillInChip}>
                      <View style={styles.chipHeader}>
                        <View style={styles.iconWrap}>
                          <Ionicons
                            name={FILL_IN_ICON.outline}
                            size={18}
                            color={colors.secondary}
                          />
                        </View>
                        <View style={styles.chipCopy}>
                          <Text style={styles.chipTitle}>Dental Hygienist</Text>
                          <Text style={styles.chipMeta}>Today · 9–5</Text>
                        </View>
                        <Text style={styles.distance}>{preview.fillInDistanceLabel}</Text>
                      </View>
                      <OnboardingButton
                        label="Request to cover"
                        accent="secondary"
                        onPress={() => {}}
                      />
                    </View>
                  </View>

                  <View style={[styles.cardLayer, phaseStyle(showConfirmedCard, 12, 100)]}>
                    <View style={styles.confirmedChip}>
                      <View style={styles.chipHeader}>
                        <View style={styles.confirmedIconWrap}>
                          <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                        </View>
                        <View style={styles.chipCopy}>
                          <Text style={styles.confirmedTitle}>Fill-in confirmed</Text>
                          <Text style={styles.chipMeta}>You’re covering Today · 9–5</Text>
                        </View>
                      </View>
                    </View>
                  </View>
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
