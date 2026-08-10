import type { ClinicApplication, JobPost, ShiftPost } from '@chairside/api';
import { formatJobApplicationSummaryMeta } from '@chairside/config';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { View } from 'react-native';

import { FillInPostingCard } from '@/components/clinic/FillInPostingCard';
import { ClinicApplicationCard } from '@/components/clinic/ClinicApplicationCard';
import { RolePostingCard } from '@/components/clinic/RolePostingCard';
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState';
import { dashboardSectionGap } from '@/components/dashboard/dashboardLayout';
import { FadeInSection } from '@/components/dashboard/FadeInSection';
import { FILL_IN_ICON } from '@/lib/fillInIcons';
import { DashboardHeroCard } from '@/components/dashboard/DashboardHeroCard';
import { DashboardHeroActions } from '@/components/dashboard/DashboardHeroActions';
import { DashboardHeroName, DashboardHeroSubtitle } from '@/components/dashboard/DashboardHeroIdentity';
import {
  DashboardStatGrid,
  DASHBOARD_OVERVIEW_SEGMENT_ACCENTS,
  getDashboardOverviewAccent,
  type DashboardOverviewStat,
} from '@/components/dashboard/DashboardStatGrid';
import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader';
import { ApplicationCardBadge } from '@/components/ui/ApplicationCardBadge';
import { ApplicantAvatarStack } from '@/components/ui/ApplicantAvatarStack';
import {
  formatApplicantCountLabelWithNew,
} from '@/components/ui/CountBadge';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useResolvedClinicLogoPath } from '@/hooks/useResolvedClinicLogoPath';
import { useClinicLogo } from '@/hooks/useClinicLogo';
import { useClinicMemberPhoto } from '@/hooks/useClinicMemberPhoto';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { CLINIC_PROFILE, type FillInReturnTarget } from '@/lib/routing';
import { formatPostedDateLabel } from '@/lib/dates';

import { isTodayOrUpcomingShiftDate } from '@/lib/fillInFilters';
import type { JobApplicantPreviewMap } from '@/lib/dashboardAttention';
import { isMainListJob } from '@/lib/postingFilters';
import { useThemedStyles } from '@/theme';

type DashboardHeroProps = {
  clinicName?: string | null;
  showActions?: boolean;
};

const CLINIC_NAME_PLACEHOLDER = 'Your practice';

export function DashboardHero({ clinicName, showActions = true }: DashboardHeroProps) {
  const { logoUri } = useClinicLogo();

  return (
    <DashboardHeroCard
      profileHref={CLINIC_PROFILE}
      avatarKind="clinic"
      displayName={clinicName}
      photoUri={logoUri}
      namePlaceholder={CLINIC_NAME_PLACEHOLDER}
      subtitle="Dental Clinic"
      showActions={showActions}
    />
  );
}

export function ClinicDashboardHeaderActions({ clinicName }: { clinicName?: string | null }) {
  const { logoUri } = useClinicLogo();
  const { photoUri: memberPhotoUri } = useClinicMemberPhoto();
  const { isGroup, membership } = useClinicProfile();
  const { profile } = useAuth();
  const personName =
    membership?.display_name?.trim() || profile?.display_name?.trim() || clinicName;

  return (
    <DashboardHeroActions
      profileHref={CLINIC_PROFILE}
      avatarKind={isGroup ? 'worker' : 'clinic'}
      displayName={isGroup ? personName : clinicName}
      photoUri={isGroup ? memberPhotoUri : logoUri}
    />
  );
}

export function ClinicDashboardHeaderName({ clinicName }: { clinicName?: string | null }) {
  return (
    <DashboardHeroName displayName={clinicName} namePlaceholder={CLINIC_NAME_PLACEHOLDER} />
  );
}

export function ClinicDashboardHeaderSubtitle() {
  return <DashboardHeroSubtitle subtitle="Dental Clinic" />;
}

export function ClinicDashboardHeaderIdentity({ clinicName }: { clinicName?: string | null }) {
  return (
    <>
      <ClinicDashboardHeaderName clinicName={clinicName} />
      <ClinicDashboardHeaderSubtitle />
    </>
  );
}

export { DashboardHeroGreeting as ClinicDashboardGreeting } from '@/components/dashboard/DashboardHeroIdentity';

/** @deprecated Use `DashboardSectionHeader` from `@/components/dashboard/DashboardSectionHeader`. */
export { DashboardSectionHeader as SectionHeader } from '@/components/dashboard/DashboardSectionHeader';

/** @deprecated Use `DashboardQuickActionTile` from `@/components/dashboard/DashboardQuickActionTile`. */
export { DashboardQuickActionTile as QuickActionTile } from '@/components/dashboard/DashboardQuickActionTile';

export type OverviewStat = DashboardOverviewStat;

type StatGridProps = {
  openRoles: number;
  fillInsPosted: number;
  totalApplications: number;
  applicationUpdateCount?: number;
  fillInUpdateCount?: number;
  selected: OverviewStat;
  onSelect: (stat: OverviewStat) => void;
};

export function StatGrid({
  openRoles,
  fillInsPosted,
  totalApplications,
  applicationUpdateCount = 0,
  fillInUpdateCount = 0,
  selected,
  onSelect,
}: StatGridProps) {
  return (
    <DashboardStatGrid
      selected={selected}
      onSelect={onSelect}
      accent={getDashboardOverviewAccent(selected)}
      segmentAccents={DASHBOARD_OVERVIEW_SEGMENT_ACCENTS}
      stats={[
        { key: 'roles', label: 'Open roles', value: openRoles, badgeCount: 0 },
        { key: 'fill-ins', label: 'Fill-ins', value: fillInsPosted, badgeCount: fillInUpdateCount },
        {
          key: 'applications',
          label: 'Applications',
          value: totalApplications,
          badgeCount: applicationUpdateCount,
        },
      ]}
    />
  );
}

const OVERVIEW_SECTION_TITLES: Record<OverviewStat, string> = {
  roles: 'Open roles',
  'fill-ins': 'Fill-ins',
  applications: 'Applications',
};

type DashboardOverviewPanelProps = {
  selected: OverviewStat;
  embedded?: boolean;
  applicantPreviewByJobId?: JobApplicantPreviewMap;
  jobs: JobPost[];
  shifts: ShiftPost[];
  applications: ClinicApplication[];
  applicantCounts?: Record<string, number>;
  shiftPendingCounts?: Record<string, number>;
  shiftApplicationCounts?: Record<string, number>;
  clinicId?: string;
  fillInReturnTo?: FillInReturnTarget;
  onJobUpdated?: (job: JobPost) => void;
  onJobDeleted?: (jobId: string) => void;
  onShiftUpdated?: (shift: ShiftPost) => void;
  onShiftDeleted?: (shiftId: string) => void;
  onJobPress?: (jobId: string) => void;
  onJobApplicationsPress?: (jobId: string) => void;
  onApplicantPress?: (applicationId: string, jobId: string) => void;
  onViewAllPress?: () => void;
};

function DashboardListCard({
  title,
  meta,
  postedAt,
  unseenCount = 0,
  applicantCount = 0,
  applicantPreview,
  locationId,
  statusBadge,
  highlighted = false,
  embedded = false,
  onPress,
}: {
  title: string;
  meta?: string;
  postedAt?: string | null;
  unseenCount?: number;
  applicantCount?: number;
  applicantPreview?: JobApplicantPreviewMap[string];
  locationId?: string | null;
  statusBadge?: ReactNode;
  highlighted?: boolean;
  embedded?: boolean;
  onPress?: () => void;
}) {
  const { clinicProfile } = useClinicProfile();
  const logoStoragePath = useResolvedClinicLogoPath(locationId);
  const clinicName = clinicProfile?.clinic_name?.trim() || 'Your clinic';
  const location = [clinicProfile?.city, clinicProfile?.province].filter(Boolean).join(', ');
  const countLabel = formatApplicantCountLabelWithNew(applicantCount, unseenCount);
  const postedLabel = formatPostedDateLabel(postedAt);
  const hasApplicants = applicantCount > 0;
  const detailLine = [hasApplicants ? countLabel : null, meta].filter(Boolean).join(' · ') || null;

  const applicantStack =
    applicantPreview && applicantPreview.length > 0 ? (
      <ApplicantAvatarStack
        names={applicantPreview.map((applicant) => applicant.name)}
        photoPaths={applicantPreview.map((applicant) => applicant.photoPath)}
        size={32}
      />
    ) : null;
  const accessory =
    highlighted || applicantStack || statusBadge ? (
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        {applicantStack}
        {highlighted ? (statusBadge ?? <ApplicationCardBadge />) : statusBadge}
      </View>
    ) : null;

  const header = (
    <ClinicPostHeader
      layout="split"
      clinicName={clinicName}
      logoStoragePath={logoStoragePath}
      title={title}
      location={location || null}
      detail={detailLine}
      postedLabel={postedLabel || null}
      avatarSize={44}
      accessory={accessory}
    />
  );

  return (
    <SurfaceCard variant={embedded ? 'inner' : 'default'} onPress={onPress}>
      {header}
    </SurfaceCard>
  );
}

export function DashboardOverviewPanel({
  selected,
  embedded = false,
  applicantPreviewByJobId,
  jobs,
  shifts,
  applications,
  applicantCounts,
  shiftPendingCounts = {},
  shiftApplicationCounts = {},
  clinicId,
  fillInReturnTo = 'dashboard-fill-ins',
  onJobUpdated,
  onJobDeleted,
  onShiftUpdated,
  onShiftDeleted,
  onJobPress,
  onJobApplicationsPress,
  onApplicantPress,
  onViewAllPress,
}: DashboardOverviewPanelProps) {
  const [expandedShiftId, setExpandedShiftId] = useState<string | null>(null);
  const styles = useThemedStyles(({ spacing }) => {
    const cardGap = embedded ? spacing.sm : dashboardSectionGap(spacing);
    return {
      root: {
        width: '100%',
        alignSelf: 'stretch' as const,
      },
      list: {
        gap: cardGap,
        width: '100%',
        alignSelf: 'stretch' as const,
      },
    };
  });

  const roleJobs = jobs.filter(isMainListJob);
  const liveShifts = shifts.filter(
    (shift) => shift.status === 'live' && isTodayOrUpcomingShiftDate(shift.shift_date),
  );

  return (
    <View style={styles.root}>
      {!embedded ? (
        <DashboardSectionHeader
          title={OVERVIEW_SECTION_TITLES[selected]}
          actionLabel={onViewAllPress ? 'View all' : undefined}
          onActionPress={onViewAllPress}
        />
      ) : null}
      <FadeInSection key={selected} delayMs={0}>
        {selected === 'roles' ? (
        roleJobs.length === 0 ? (
          <DashboardEmptyState
            icon="briefcase-outline"
            title="No active roles yet"
            message="Post a role to start receiving applications from dental professionals."
          />
        ) : (
          <View style={styles.list}>
            {roleJobs.map((job) => (
                <RolePostingCard
                  key={job.id}
                  job={job}
                  embedded={embedded}
                  applicants={applicantPreviewByJobId?.[job.id]}
                  applicantCount={applicantCounts?.[job.id] ?? 0}
                  onPress={onJobPress ? () => onJobPress(job.id) : undefined}
                  onApplicantsPress={
                    onJobApplicationsPress ? () => onJobApplicationsPress(job.id) : undefined
                  }
                  onApplicantPress={
                    onApplicantPress
                      ? (applicationId) => onApplicantPress(applicationId, job.id)
                      : undefined
                  }
                  manage={
                    embedded
                      ? undefined
                      : clinicId && onJobUpdated && onJobDeleted
                        ? {
                            clinicId,
                            onUpdated: onJobUpdated,
                            onDeleted: () => onJobDeleted(job.id),
                          }
                        : undefined
                  }
                />
              ))}
          </View>
        )
      ) : null}

      {selected === 'fill-ins' ? (
        liveShifts.length === 0 ? (
          <DashboardEmptyState
            icon={FILL_IN_ICON.outline}
            title="No fill-in shifts yet"
            message="Post a fill-in shift when you need temporary coverage."
            accent="secondary"
          />
        ) : (
          <View style={styles.list}>
            {liveShifts.map((shift) => (
              <FillInPostingCard
                key={shift.id}
                embedded={embedded}
                shift={shift}
                pendingRequestCount={shiftPendingCounts[shift.id] ?? 0}
                applicationCount={shiftApplicationCounts[shift.id] ?? 0}
                clinicId={clinicId}
                returnTo={fillInReturnTo}
                accent="secondary"
                expanded={expandedShiftId === shift.id}
                onExpandChange={(next) => setExpandedShiftId(next ? shift.id : null)}
                onShiftUpdated={onShiftUpdated}
                onShiftDeleted={() => onShiftDeleted?.(shift.id)}
              />
            ))}
          </View>
        )
      ) : null}

      {selected === 'applications' ? (
        applications.length === 0 ? (
          <DashboardEmptyState
            icon="people-outline"
            title="No applications yet"
            message="Applications will appear here when workers apply to your roles."
          />
        ) : (
          <View style={styles.list}>
            {applications.map((application) => (
              <ClinicApplicationCard
                key={application.id}
                application={application}
                embedded={embedded}
                returnTo="dashboard-applications"
              />
            ))}
          </View>
        )
        ) : null}
      </FadeInSection>
    </View>
  );
}
