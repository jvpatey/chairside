import type {
  JobMatchBreakdown,
  JobMatchContext,
  MatchDetailAudience,
  MatchLevel,
} from '@chairside/core';
import { getMatchCriterionDetails, getMatchTierLabel } from '@chairside/core';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WORKER_SETUP_SKILLS } from '@/lib/routing';
import { getMatchTierPalette, getMatchTierSummaryHint } from '@/lib/matchTierPalette';
import {
  webHover,
  webPointer,
  webTextLinkHoverStyles,
} from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type MatchDetailModalProps = {
  visible: boolean;
  onClose: () => void;
  breakdown: JobMatchBreakdown;
  context: Partial<JobMatchContext> & {
    postRoleLabel?: string;
    workerRoleLabel?: string;
    postEmploymentLabel?: string;
    workerEmploymentLabels?: string[];
  };
  subtitle?: string;
  showProfileHint?: boolean;
  audience?: MatchDetailAudience;
};

function MatchLevelIcon({ level }: { level: MatchLevel }) {
  const { colors } = useTheme();

  if (level === 'strong') {
    return <Ionicons name="checkmark-circle" size={22} color={colors.secondary} />;
  }
  if (level === 'partial') {
    return <Ionicons name="remove-circle" size={22} color={colors.warning} />;
  }
  return <Ionicons name="close-circle" size={22} color={colors.destructive} />;
}

export function MatchDetailModal({
  visible,
  onClose,
  breakdown,
  context,
  subtitle,
  showProfileHint = false,
  audience = 'worker',
}: MatchDetailModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const criteria = getMatchCriterionDetails(breakdown, context, audience);
  const canImprove = criteria.some((item) => {
    if (item.level === 'strong') return false;
    if (
      item.id === 'software' &&
      item.level === 'partial' &&
      !breakdown.postHasMatchableSoftware
    ) {
      return false;
    }
    return true;
  });
  const strongCount = criteria.filter((item) => item.level === 'strong').length;
  const palette = getMatchTierPalette(breakdown.tier, colors);
  const summaryHint = getMatchTierSummaryHint(
    breakdown.tier,
    strongCount,
    criteria.length,
    audience,
  );
  const modalTitle = audience === 'clinic' ? 'Applicant match' : 'Match details';

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.35)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '85%',
    },
    handle: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.separator,
      marginTop: spacing.sm,
      marginBottom: spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      gap: spacing.md,
    },
    headerText: { flex: 1, gap: 4 },
    title: { ...typography.body, fontWeight: '700', fontSize: 18 },
    subtitle: typography.subtitle,
    donePressable: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.xs,
      marginRight: -spacing.xs,
      borderRadius: 8,
      ...webPointer(),
    },
    done: { color: colors.primary, fontWeight: '600', fontSize: 16 },
    doneHovered: webTextLinkHoverStyles(colors),
    scroll: { paddingHorizontal: spacing.lg },
    tierHero: {
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    tierPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    tierLabel: {
      fontSize: 15,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    tierHint: {
      ...typography.subtitle,
      fontSize: 14,
      textAlign: 'center',
    },
    list: { gap: spacing.md, paddingBottom: spacing.lg },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    rowText: { flex: 1, gap: 4 },
    rowTitle: { ...typography.body, fontWeight: '600' },
    rowExplanation: typography.subtitle,
    footer: {
      borderTopWidth: 1,
      borderTopColor: colors.separator,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      gap: spacing.sm,
    },
    hint: typography.subtitle,
    profileLinkPressable: {
      alignSelf: 'flex-start',
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.xs,
      marginLeft: -spacing.xs,
      borderRadius: 8,
      ...webPointer(),
    },
    profileLinkHovered: webTextLinkHoverStyles(colors),
    profileLink: { color: colors.primary, fontWeight: '600' },
  }));

  const handleProfileLink = () => {
    onClose();
    router.push(WORKER_SETUP_SKILLS);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
      onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}
          onPress={(event) => event.stopPropagation()}>
          <View style={styles.handle} accessibilityElementsHidden />

          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{modalTitle}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Done"
              style={({ pressed, hovered }) => [
                styles.donePressable,
                webHover(hovered, pressed, styles.doneHovered),
              ]}>
              <Text style={styles.done}>Done</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.tierHero}>
              <View
                style={[
                  styles.tierPill,
                  {
                    backgroundColor: palette.backgroundColor,
                    borderColor: palette.borderColor,
                  },
                ]}>
                <Ionicons name={palette.icon} size={18} color={palette.color} />
                <Text style={[styles.tierLabel, { color: palette.color }]}>
                  {getMatchTierLabel(breakdown.tier)}
                </Text>
              </View>
              <Text style={styles.tierHint}>{summaryHint}</Text>
            </View>

            <View style={styles.list}>
              {criteria.map((item) => (
                <View key={item.id} style={styles.row}>
                  <MatchLevelIcon level={item.level} />
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{item.title}</Text>
                    <Text style={styles.rowExplanation}>{item.explanation}</Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          {showProfileHint && canImprove ? (
            <View style={styles.footer}>
              <Text style={styles.hint}>
                Update your profile to improve how you match with open roles.
              </Text>
              <Pressable
                onPress={handleProfileLink}
                accessibilityRole="button"
                accessibilityLabel="Update profile"
                style={({ pressed, hovered }) => [
                  styles.profileLinkPressable,
                  webHover(hovered, pressed, styles.profileLinkHovered),
                  pressed && { opacity: 0.75 },
                ]}>
                <Text style={styles.profileLink}>Update profile</Text>
              </Pressable>
            </View>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
