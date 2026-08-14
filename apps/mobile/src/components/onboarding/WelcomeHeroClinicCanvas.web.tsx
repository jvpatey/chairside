import { Ionicons } from '@expo/vector-icons';
import {
  formatApplicationEducation,
  formatClinicApplicationStatus,
  formatJobPostRoleMeta,
  formatRoleTypesLabel,
} from '@chairside/config';
import { useMemo, useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { JobPostStatusBadge } from '@/components/clinic/JobPostStatusBadge';
import { RoleApplicantPreviewList } from '@/components/clinic/RoleApplicantPreviewList';
import { DashboardHero } from '@/components/dashboard/DashboardHero';
import { FileTabWell } from '@/components/dashboard/FileTabWell';
import { MatchTierBadge } from '@/components/matching/MatchTierBadge';
import { WelcomeHeroFillInCard } from '@/components/onboarding/WelcomeHeroFillInCard.web';
import { ApplicantAvatarStack } from '@/components/ui/ApplicantAvatarStack';
import { ApplicationCardBadge } from '@/components/ui/ApplicationCardBadge';
import { CardSectionDivider } from '@/components/ui/CardTitleSection';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { getSidebarNavIconColor } from '@/components/navigation/sidebarNavIcons';
import { FILL_IN_ICON } from '@/lib/fillInIcons';
import { formatPostedDateLabel, formatRelativeApplicationAge } from '@/lib/dates';
import { buildClinicHeroPulse } from '@/lib/dashboardPulse';
import { getTabAccentForName } from '@/lib/tabAtmosphereRoutes';
import { CLINIC_PROFILE } from '@/lib/routing';
import {
  getWelcomeHeroPreview,
  type WelcomeHeroApplicant,
  type WelcomeHeroPreview,
} from '@/lib/welcomeHeroPreview';
import { webOnlyStyle } from '@/lib/webPressableStyles';
import { fontSemibold, useTheme, useThemedStyles } from '@/theme';
import type { DashboardOverviewStat } from '@/components/dashboard/DashboardStatGrid';
import { resolveAccentSubtle } from '@/lib/accentColors';

type WelcomeHeroClinicCanvasProps = {
  compact?: boolean;
  preview?: WelcomeHeroPreview;
};

function PreviewApplicationCard({
  applicant,
  postTitle,
  roleType,
}: {
  applicant: WelcomeHeroApplicant;
  postTitle: string;
  roleType: string;
}) {
  const { colors } = useTheme();
  const qualifications = [
    `${applicant.yearsOfExperience} ${
      applicant.yearsOfExperience === 1 ? 'year' : 'years'
    } experience`,
    formatApplicationEducation(applicant.education),
    formatRoleTypesLabel([roleType]),
  ]
    .filter(Boolean)
    .join(' · ');
  const relativeAge = formatRelativeApplicationAge(applicant.appliedAt);
  const contextLine = relativeAge ? `Applied ${relativeAge}` : null;
  const statusLabel = formatClinicApplicationStatus(applicant.status);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    row: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: spacing.md,
    },
    body: {
      flex: 1,
      minWidth: 0,
      gap: spacing.sm,
    },
    headerStack: {
      gap: spacing.xs,
    },
    identityBlock: {
      gap: 2,
    },
    titleRow: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: spacing.sm,
      minWidth: 0,
    },
    name: {
      flex: 1,
      minWidth: 0,
      ...typography.body,
      fontSize: 18,
      lineHeight: 23,
      fontWeight: '700' as const,
      letterSpacing: -0.3,
      color: colors.labelPrimary,
    },
    postContext: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '500' as const,
      color: colors.labelSecondary,
    },
    matchSlot: {
      flexShrink: 0,
      paddingTop: 1,
    },
    statusRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
      minWidth: 0,
      flexWrap: 'wrap' as const,
    },
    statusText: {
      flexShrink: 1,
      minWidth: 0,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: colors.labelSecondary,
    },
    statusValue: {
      color: colors.labelPrimary,
    },
    detailsBlock: {
      gap: spacing.xs,
    },
    details: {
      gap: spacing.xs,
      paddingTop: spacing.xs,
    },
    qualifications: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500' as const,
      color: colors.labelPrimary,
    },
    context: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
    chevron: {
      paddingTop: 2,
    },
  }));

  return (
    <SurfaceCard variant="inner" padding="md">
      <View style={styles.row}>
        <WorkerProfileAvatar displayName={applicant.name} size={44} />
        <View style={styles.body}>
          <View style={styles.headerStack}>
            <View style={styles.identityBlock}>
              <View style={styles.titleRow}>
                <Text style={styles.name} numberOfLines={2}>
                  {applicant.name}
                </Text>
                <View style={styles.matchSlot}>
                  <MatchTierBadge
                    breakdown={applicant.match}
                    context={applicant.matchContext}
                    subtitle={postTitle}
                    audience="clinic"
                  />
                </View>
              </View>
              <Text style={styles.postContext} numberOfLines={1}>
                {postTitle}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusText} numberOfLines={1}>
                Status: <Text style={styles.statusValue}>{statusLabel}</Text>
              </Text>
              {applicant.isNew ? <ApplicationCardBadge /> : null}
            </View>
          </View>
          <View style={styles.detailsBlock}>
            <CardSectionDivider />
            <View style={styles.details}>
              <Text style={styles.qualifications} numberOfLines={2}>
                {qualifications}
              </Text>
              {contextLine ? (
                <Text style={styles.context} numberOfLines={2}>
                  {contextLine}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
        <View style={styles.chevron}>
          <Ionicons name="chevron-forward" size={18} color={colors.labelTertiary} />
        </View>
      </View>
    </SurfaceCard>
  );
}

function PreviewSidebar({ compact }: { compact: boolean }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing }) => ({
    sidebar: {
      width: compact ? 48 : 56,
      borderRightWidth: 1,
      borderRightColor: colors.separator,
      backgroundColor: colors.surface,
      paddingVertical: spacing.sm,
      paddingHorizontal: compact ? 4 : 6,
      gap: spacing.xs,
      alignItems: 'center' as const,
    },
    section: {
      gap: 2,
      alignItems: 'center' as const,
      width: '100%' as const,
    },
    divider: {
      height: 1,
      width: compact ? 20 : 24,
      backgroundColor: colors.separator,
      marginVertical: spacing.xs,
    },
    item: {
      width: compact ? 36 : 40,
      height: compact ? 36 : 40,
      borderRadius: 12,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
  }));

  const primary = [
    {
      route: 'index',
      icon: 'home-outline' as const,
      activeIcon: 'home' as const,
      label: 'Dashboard',
      active: true,
    },
    {
      route: 'postings',
      icon: 'briefcase-outline' as const,
      activeIcon: 'briefcase' as const,
      label: 'Roles',
      active: false,
    },
    {
      route: 'applications',
      icon: 'people-outline' as const,
      activeIcon: 'people' as const,
      label: 'Applications',
      active: false,
    },
    {
      route: 'fill-ins',
      icon: FILL_IN_ICON.outline,
      activeIcon: FILL_IN_ICON.filled,
      label: 'Fill-ins',
      active: false,
    },
  ];
  const secondary = [
    {
      route: 'discover',
      icon: 'compass-outline' as const,
      activeIcon: 'compass' as const,
      label: 'Discover',
      active: false,
    },
    {
      route: 'calendar',
      icon: 'today-outline' as const,
      activeIcon: 'today' as const,
      label: 'Calendar',
      active: false,
    },
    {
      route: 'messages',
      icon: 'chatbubbles-outline' as const,
      activeIcon: 'chatbubbles' as const,
      label: 'Messages',
      active: false,
    },
  ];

  const renderItem = (item: (typeof primary)[number] | (typeof secondary)[number]) => {
    const accent = getTabAccentForName(item.route);
    const iconColor = getSidebarNavIconColor(colors, accent, item.active);
    return (
      <View
        key={item.label}
        style={[
          styles.item,
          item.active && { backgroundColor: resolveAccentSubtle(colors, accent) },
        ]}
      >
        <Ionicons name={item.active ? item.activeIcon : item.icon} size={20} color={iconColor} />
      </View>
    );
  };

  return (
    <View
      style={styles.sidebar}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.section}>{primary.map(renderItem)}</View>
      <View style={styles.divider} />
      <View style={styles.section}>{secondary.map(renderItem)}</View>
    </View>
  );
}

export function WelcomeHeroClinicCanvas({
  compact = false,
  preview: previewProp,
}: WelcomeHeroClinicCanvasProps) {
  const preview = useMemo(() => previewProp ?? getWelcomeHeroPreview(), [previewProp]);
  const [selected, setSelected] = useState<DashboardOverviewStat>('roles');
  const visibleApplicants = preview.applicants.slice(0, compact ? 1 : 2);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    root: {
      flex: compact ? 1 : undefined,
      flexDirection: 'row' as const,
      alignItems: 'stretch' as const,
      alignSelf: 'stretch' as const,
      minWidth: 0,
      minHeight: compact ? 0 : undefined,
      backgroundColor: colors.backgroundGrouped,
    },
    main: {
      flex: 1,
      minWidth: 0,
      padding: compact ? spacing.sm : spacing.md,
      gap: compact ? spacing.sm : spacing.md,
    },
    wage: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.primary,
    },
    cardBody: {
      padding: spacing.md,
    },
    list: {
      gap: spacing.sm,
      width: '100%' as const,
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
  }));

  const roleCard = (
    <SurfaceCard variant="inner" padding="none">
      <View style={styles.cardBody}>
        <ClinicPostHeader
          layout="split"
          clinicName={preview.clinic.name}
          logoStoragePath={null}
          title={preview.job.title}
          location={preview.clinic.locationLabel}
          detail={formatJobPostRoleMeta(preview.job)}
          postedLabel={formatPostedDateLabel(preview.job.created_at) || null}
          textFooter={
            preview.job.wage_range ? (
              <Text style={styles.wage}>{preview.job.wage_range}</Text>
            ) : undefined
          }
          avatarSize={compact ? 36 : 40}
          accessory={<JobPostStatusBadge status={preview.job.status} />}
          detailAccessory={
            <ApplicantAvatarStack
              names={visibleApplicants.map((applicant) => applicant.name)}
              size={compact ? 28 : 32}
            />
          }
        />
      </View>
      {!compact ? (
        <RoleApplicantPreviewList applicants={visibleApplicants} onApplicantPress={() => {}} />
      ) : null}
    </SurfaceCard>
  );

  const fillInCard = <WelcomeHeroFillInCard preview={preview} embedded />;

  const applicationCards = (
    <View style={styles.list}>
      {visibleApplicants.map((applicant) => (
        <PreviewApplicationCard
          key={applicant.id}
          applicant={applicant}
          postTitle={preview.job.title}
          roleType={preview.job.role_type}
        />
      ))}
    </View>
  );

  const panels: { value: DashboardOverviewStat; content: ReactNode }[] = [
    { value: 'roles', content: roleCard },
    { value: 'fill-ins', content: fillInCard },
    { value: 'applications', content: applicationCards },
  ];

  return (
    <View style={styles.root}>
      <PreviewSidebar compact={compact} />
      <View style={styles.main}>
        <DashboardHero
          profileHref={CLINIC_PROFILE}
          avatarKind="clinic"
          displayName={preview.clinic.name}
          namePlaceholder="Your practice"
          subtitle="Dental practice"
          pulse={buildClinicHeroPulse({
            newApplications: preview.stats.applications,
            onOpenApplications: () => setSelected('applications'),
          })}
          showActions={false}
        />

        <FileTabWell<DashboardOverviewStat>
          variant="dashboard"
          compactTabs={compact}
          expandSelectedTab={false}
          selected={selected}
          onSelect={setSelected}
          tabs={[
            {
              value: 'roles',
              label: 'Roles',
              count: preview.stats.openRoles,
              accent: 'primary',
              icon: 'briefcase-outline',
            },
            {
              value: 'fill-ins',
              label: 'Fill-ins',
              count: preview.stats.fillIns,
              accent: 'secondary',
              icon: FILL_IN_ICON.outline,
            },
            {
              value: 'applications',
              label: 'Applications',
              count: preview.stats.applications,
              accent: 'tertiary',
              icon: 'people-outline',
            },
          ]}
        >
          {compact ? (
            panels.find((panel) => panel.value === selected)?.content
          ) : (
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
          )}
        </FileTabWell>
      </View>
    </View>
  );
}
