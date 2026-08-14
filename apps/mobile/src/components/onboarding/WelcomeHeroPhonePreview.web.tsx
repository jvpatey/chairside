import { Ionicons } from '@expo/vector-icons';
import { formatApplicationDate, formatRoleTypesLabel } from '@chairside/config';
import { useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { DashboardHero } from '@/components/dashboard/DashboardHero';
import { DashboardQuickActionsRow } from '@/components/dashboard/DashboardQuickActionsRow';
import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader';
import { FileTabWell } from '@/components/dashboard/FileTabWell';
import type { DashboardOverviewStat } from '@/components/dashboard/DashboardStatGrid';
import { WorkerApplicationStatusLabel } from '@/components/matching/ApplicationStatusBadge';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { FillInListingCard } from '@/components/worker/FillInListingCard';
import { RoleListingCard } from '@/components/worker/RoleListingCard';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { FILL_IN_ICON } from '@/lib/fillInIcons';
import { WORKER_PROFILE } from '@/lib/routing';
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

const WORKER_TABS = [
  { icon: 'home' as const, outline: 'home-outline' as const, label: 'Home', active: true },
  { icon: 'briefcase' as const, outline: 'briefcase-outline' as const, label: 'Roles', active: false },
  { icon: 'document-text' as const, outline: 'document-text-outline' as const, label: 'Applications', active: false },
  { icon: FILL_IN_ICON.filled, outline: FILL_IN_ICON.outline, label: 'Fill-ins', active: false },
  { icon: 'today' as const, outline: 'today-outline' as const, label: 'Calendar', active: false },
  { icon: 'chatbubbles' as const, outline: 'chatbubbles-outline' as const, label: 'Messages', active: false },
] as const;

function PreviewWorkerApplicationCard({ preview }: { preview: WelcomeHeroPreview }) {
  const { colors } = useTheme();
  const application = preview.applicants[0];
  const appliedLabel = formatApplicationDate(application.appliedAt);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    trailingRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'flex-end' as const,
      gap: spacing.sm,
    },
  }));

  return (
    <SurfaceCard variant="inner" padding="md" gap>
      <ClinicPostHeader
        layout="split"
        headerOnly
        clinicName={preview.clinic.name}
        logoStoragePath={null}
        title={preview.job.title}
        location={null}
        statusLabel={
          <WorkerApplicationStatusLabel
            status={application.status}
            postType="job"
            showStatusPrefix
          />
        }
        postedLabel={appliedLabel ? `Applied ${appliedLabel}` : null}
        detail="The clinic is reviewing your application."
        avatarSize={44}
      />
      <View style={styles.trailingRow}>
        <Ionicons name="chevron-forward" size={18} color={colors.labelTertiary} />
      </View>
    </SurfaceCard>
  );
}

export function WelcomeHeroPhonePreview({
  preview,
  compact = false,
}: WelcomeHeroPhonePreviewProps) {
  const { colors } = useTheme();
  const scale = compact ? COMPACT_SCALE : LANDING_SCALE;
  const frameWidth = PHONE_WIDTH * scale;
  const frameHeight = PHONE_HEIGHT * scale;
  const [selected, setSelected] = useState<DashboardOverviewStat>('roles');
  const workerMatch = preview.applicants[0];

  const styles = useThemedStyles(({ colors, spacing, radii, isDark: dark }) => ({
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
    panelStack: {
      ...webOnlyStyle({
        display: 'grid',
        alignItems: 'start',
      } as object),
    },
    panelLayer: {
      ...webOnlyStyle({
        gridArea: '1 / 1',
      } as object),
    },
    panelHidden: {
      ...webOnlyStyle({
        visibility: 'hidden',
      } as object),
      pointerEvents: 'none' as const,
      zIndex: 0,
    },
    group: {
      gap: spacing.sm,
      width: '100%' as const,
    },
    tabBarOuter: {
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      backgroundColor: 'transparent',
    },
    dock: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: 4,
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xs,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
      borderRadius: radii.lg,
      overflow: 'hidden' as const,
    },
    tabItem: {
      flex: 1,
      minHeight: 54,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: radii.sm,
      overflow: 'hidden' as const,
      paddingHorizontal: 4,
      paddingVertical: spacing.xs,
      gap: 2,
    },
    tabLabel: {
      fontSize: 10,
      fontWeight: '500' as const,
      color: colors.tabInactive,
      textAlign: 'center' as const,
    },
    tabLabelActive: {
      fontWeight: '600' as const,
    },
    homeIndicator: {
      alignSelf: 'center' as const,
      width: 134,
      height: 5,
      borderRadius: 999,
      backgroundColor: colors.labelTertiary,
      opacity: 0.4,
      marginBottom: 8,
    },
  }));

  const roleCard = (
    <RoleListingCard
      job={preview.job}
      embedded
      jobMatch={workerMatch.match}
      matchContext={workerMatch.matchContext}
      distanceLabel={preview.fillInDistanceLabel}
    />
  );

  const fillInCard = (
    <View style={styles.group}>
      <DashboardSectionHeader title="Open" compact />
      <FillInListingCard
        shift={preview.shift}
        distanceLabel={preview.fillInDistanceLabel}
        accent="secondary"
        embedded
      />
    </View>
  );

  const applicationCard = <PreviewWorkerApplicationCard preview={preview} />;

  const panels: { value: DashboardOverviewStat; content: ReactNode }[] = [
    { value: 'roles', content: roleCard },
    { value: 'applications', content: applicationCard },
    { value: 'fill-ins', content: fillInCard },
  ];

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
              <DashboardHero
                profileHref={WORKER_PROFILE}
                avatarKind="worker"
                displayName={preview.workerFirstName}
                namePlaceholder="Your profile"
                subtitle={
                  formatRoleTypesLabel([preview.job.role_type]) || 'Dental professional'
                }
                greetingName={preview.workerFirstName}
                showActions={false}
                forcePhoneLayout
              />
              <DashboardQuickActionsRow
                forcePhoneLayout
                actions={[
                  {
                    label: 'Find jobs',
                    description: 'Browse open roles nearby',
                    icon: 'briefcase-outline',
                    variant: 'primary',
                    onPress: () => setSelected('roles'),
                  },
                  {
                    label: 'Find fill-ins',
                    description: 'Browse temp shifts nearby',
                    icon: FILL_IN_ICON.outline,
                    variant: 'secondary',
                    onPress: () => setSelected('fill-ins'),
                  },
                ]}
              />
              <FileTabWell<DashboardOverviewStat>
                variant="dashboard"
                compactTabs
                selected={selected}
                onSelect={setSelected}
                tabs={[
                  {
                    value: 'roles',
                    label: 'Roles',
                    count: preview.workerStats.openRoles,
                    accent: 'primary',
                    icon: 'briefcase-outline',
                  },
                  {
                    value: 'applications',
                    label: 'Applications',
                    count: preview.workerStats.applications,
                    accent: 'tertiary',
                    icon: 'document-text-outline',
                  },
                  {
                    value: 'fill-ins',
                    label: 'Fill-ins',
                    count: preview.workerStats.fillIns,
                    accent: 'secondary',
                    icon: FILL_IN_ICON.outline,
                  },
                ]}
              >
                <View style={styles.panelStack}>
                  {panels.map((panel) => {
                    const isSelected = selected === panel.value;
                    return (
                      <View
                        key={panel.value}
                        style={[styles.panelLayer, !isSelected && styles.panelHidden]}
                        accessibilityElementsHidden={!isSelected}
                        importantForAccessibility={isSelected ? 'auto' : 'no-hide-descendants'}
                      >
                        {panel.content}
                      </View>
                    );
                  })}
                </View>
              </FileTabWell>
            </View>

            <View style={styles.tabBarOuter}>
              <View style={styles.dock}>
                {WORKER_TABS.map((tab) => (
                  <View
                    key={tab.label}
                    style={[
                      styles.tabItem,
                      tab.active && { backgroundColor: colors.primary },
                    ]}
                  >
                    <Ionicons
                      name={tab.active ? tab.icon : tab.outline}
                      size={20}
                      color={tab.active ? colors.primaryOnPrimary : colors.tabInactive}
                    />
                    <Text
                      style={[
                        styles.tabLabel,
                        tab.active && [
                          styles.tabLabelActive,
                          { color: colors.primaryOnPrimary },
                        ],
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.75}
                    >
                      {tab.label}
                    </Text>
                  </View>
                ))}
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
