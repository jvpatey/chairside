import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { EditPillButton } from '@/components/ui/EditPillButton';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { AvailabilityScheduleSummary } from '@/components/worker/AvailabilityScheduleSummary';
import { FillInModePanel } from '@/components/worker/FillInModePanel';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { WORKER_SETUP_AVAILABILITY_SCHEDULE } from '@/lib/routing';
import {
  FILL_IN_HERO_GRADIENT_LOCATIONS,
  getFillInHeroGradient,
  radii,
  useTheme,
  useThemedStyles,
} from '@/theme';

function navigateToEditSchedule() {
  router.push(WORKER_SETUP_AVAILABILITY_SCHEDULE);
}

function FillInAvailabilityPanelAccent({ children }: { children: React.ReactNode }) {
  const { colors, isDark } = useTheme();
  const gradient = getFillInHeroGradient(colors, isDark);
  const styles = useThemedStyles(() => ({
    wrap: {
      borderRadius: radii.lg,
      overflow: 'hidden',
      position: 'relative',
    },
    gradient: StyleSheet.absoluteFillObject,
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
      {children}
    </View>
  );
}

export function FillInAvailabilityManageView() {
  const { workerProfile, availabilityBlocks } = useWorkerProfile();
  const fillInsAvailable = workerProfile?.short_notice_available ?? false;

  const styles = useThemedStyles(({ spacing, typography, colors }) => ({
    content: { gap: spacing.lg },
    daysCardMuted: {
      opacity: 0.55,
    },
    scheduleHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    scheduleHeaderText: {
      flex: 1,
      gap: spacing.xs,
    },
    scheduleTitle: {
      fontSize: 17,
      fontWeight: '600',
      letterSpacing: -0.2,
      color: colors.labelPrimary,
    },
    scheduleSubtitle: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
  }));

  return (
    <View style={styles.content}>
      <FillInAvailabilityPanelAccent>
        <SurfaceCard padding="none">
          <FillInModePanel variant="grouped" />
        </SurfaceCard>
      </FillInAvailabilityPanelAccent>
      <SurfaceCard
        padding="md"
        gap
        style={!fillInsAvailable ? styles.daysCardMuted : undefined}
      >
        <View style={styles.scheduleHeader}>
          <View style={styles.scheduleHeaderText}>
            <Text style={styles.scheduleTitle}>Available days</Text>
            <Text style={styles.scheduleSubtitle}>
              {fillInsAvailable
                ? 'The days and hours you can cover fill-in shifts. Used to filter alerts when you choose matching days only.'
                : 'Turn on fill-ins above, then choose which days and hours you can cover temp shifts.'}
            </Text>
          </View>
          <EditPillButton label="Edit days" onPress={navigateToEditSchedule} />
        </View>
        <AvailabilityScheduleSummary blocks={availabilityBlocks} variant="grouped" />
      </SurfaceCard>
    </View>
  );
}
