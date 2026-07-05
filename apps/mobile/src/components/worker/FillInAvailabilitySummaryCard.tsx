import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FillInAvailabilityPrimaryToggle } from '@/components/worker/FillInAvailabilityPrimaryToggle';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { getFillInAvailabilityCollapsedSummary } from '@/lib/fillInAvailabilitySummary';
import { WORKER_FILLIN_AVAILABILITY } from '@/lib/routing';
import { webHover, webPointer } from '@/lib/webPressableStyles';
import {
  FILL_IN_HERO_GRADIENT_LOCATIONS,
  getFillInHeroGradient,
  radii,
  spacing,
  useTheme,
  useThemedStyles,
} from '@/theme';

function navigateToManageAvailability() {
  router.push(WORKER_FILLIN_AVAILABILITY);
}

export function FillInAvailabilitySummaryCard() {
  const { colors, isDark } = useTheme();
  const { workerProfile, availabilityBlocks } = useWorkerProfile();
  const summary = getFillInAvailabilityCollapsedSummary(workerProfile, availabilityBlocks);
  const gradient = getFillInHeroGradient(colors, isDark);

  const styles = useThemedStyles(({ spacing, typography, colors }) => ({
    wrap: {
      borderRadius: radii.lg,
      overflow: 'hidden',
      position: 'relative',
    },
    gradient: StyleSheet.absoluteFillObject,
    content: {
      padding: spacing.md,
      gap: spacing.sm,
    },
    managePressable: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 8,
      ...webPointer(),
    },
    managePressableHovered: {
      backgroundColor: `${colors.labelPrimary}08`,
    },
    manageText: {
      flex: 1,
      gap: spacing.xs,
    },
    status: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    statusPositive: {
      color: colors.success,
    },
    schedule: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
    manageLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.secondary,
    },
    chevron: {
      marginTop: 2,
    },
  }));

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={gradient}
        locations={FILL_IN_HERO_GRADIENT_LOCATIONS}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradient}
        pointerEvents="none"
      />
      <View style={styles.content}>
        <FillInAvailabilityPrimaryToggle bleedPadding={spacing.md} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Manage fill-in availability"
          onPress={navigateToManageAvailability}
          style={({ pressed, hovered }) => [
            styles.managePressable,
            webHover(hovered, pressed, styles.managePressableHovered),
            pressed && { opacity: 0.85 },
          ]}
        >
          <View style={styles.manageText}>
            <Text
              style={[
                styles.status,
                summary.primaryTone === 'positive' ? styles.statusPositive : null,
              ]}
            >
              {summary.primary}
            </Text>
            <Text style={styles.schedule}>
              {summary.secondaryLabel}: {summary.secondary}
            </Text>
            <Text style={styles.manageLabel}>Manage availability</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.labelTertiary}
            style={styles.chevron}
          />
        </Pressable>
      </View>
    </View>
  );
}
