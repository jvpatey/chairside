import type { ConfirmedFillInSummary, JobApplicationSummary, JobPost, ShiftPost } from '@chairside/api';
import { formatJobApplicationSummaryMeta } from '@chairside/config';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { View } from 'react-native';

import { FillInPostingCard } from '@/components/clinic/FillInPostingCard';
import { ConfirmedFillInCard } from '@/components/clinic/ConfirmedFillInCard';
import { RolePostingCard } from '@/components/clinic/RolePostingCard';
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState';
import { FadeInSection } from '@/components/dashboard/FadeInSection';
import { dashboardSectionGap } from '@/components/dashboard/dashboardLayout';
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
import { ApplicantCountButton } from '@/components/ui/ApplicantCountButton';
import {
  formatApplicantCountLabelWithNew,
} from '@/components/ui/CountBadge';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicLogo } from '@/hooks/useClinicLogo';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { CLINIC_PROFILE, type FillInReturnTarget } from '@/lib/routing';
import { formatPostedDateLabel } from '@/lib/dates';

import { isTodayOrUpcomingShiftDate } from '@/lib/fillInFilters';
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

  return (
    <DashboardHeroActions
      profileHref={CLINIC_PROFILE}
      avatarKind="clinic"
      displayName={clinicName}
      photoUri={logoUri}
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
  jobs: JobPost[];
  shifts: ShiftPost[];
  confirmedFillIns?: ConfirmedFillInSummary[];
  jobApplicationSummaries: JobApplicationSummary[];
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
  onViewAllPress?: () => void;
};

function DashboardListCard({
  title,
  meta,
  postedAt,
  unseenCount = 0,
  applicantCount = 0,
  statusBadge,
  highlighted = false,
  onPress,
}: {
  title: string;
  meta?: string;
  postedAt?: string | null;
  unseenCount?: number;
  applicantCount?: number;
  statusBadge?: ReactNode;
  highlighted?: boolean;
  onPress?: () => void;
}) {
  const { clinicProfile } = useClinicProfile();
  const clinicName = clinicProfile?.clinic_name?.trim() || 'Your clinic';
  const location = [clinicProfile?.city, clinicProfile?.province].filter(Boolean).join(', ');
  const countLabel = formatApplicantCountLabelWithNew(applicantCount, unseenCount);
  const postedLabel = formatPostedDateLabel(postedAt);
  const hasApplicants = applicantCount > 0;

  const accessory = highlighted ? (statusBadge ?? <ApplicationCardBadge />) : statusBadge;

  const applicantControl =
    hasApplicants && onPress
      ? (
          <ApplicantCountButton
            label={countLabel}
            highlighted={highlighted}
            onPress={onPress}
            accessibilityLabel={`Review ${applicantCount} applicants`}
          />
        )
      : hasApplicants
        ? (
            <ApplicantCountButton label={countLabel} highlighted={highlighted} showChevron={false} />
          )
        : null;

  const header = (
    <ClinicPostHeader
      layout="split"
      clinicName={clinicName}
      logoStoragePath={clinicProfile?.logo_storage_path}
      title={title}
      location={location || null}
      detail={meta ?? null}
      postedLabel={postedLabel || null}
      avatarSize={44}
      accessory={accessory}
      detailAccessory={applicantControl}
    />
  );

  return (
    <SurfaceCard onPress={onPress}>
      {header}
    </SurfaceCard>
  );
}

export function DashboardOverviewPanel({
  selected,
  jobs,
  shifts,
  confirmedFillIns = [],
  jobApplicationSummaries,
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
  onViewAllPress,
}: DashboardOverviewPanelProps) {
  const [expandedShiftId, setExpandedShiftId] = useState<string | null>(null);
  const [expandedConfirmedId, setExpandedConfirmedId] = useState<string | null>(null);
  const styles = useThemedStyles(({ spacing }) => {
    const cardGap = dashboardSectionGap(spacing);
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
      subsection: {
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
      <DashboardSectionHeader
        title={OVERVIEW_SECTION_TITLES[selected]}
        actionLabel={onViewAllPress ? 'View all' : undefined}
        onActionPress={onViewAllPress}
      />
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
                  applicantCount={applicantCounts?.[job.id] ?? 0}
                  onPress={onJobPress ? () => onJobPress(job.id) : undefined}
                  onApplicantsPress={
                    onJobApplicationsPress ? () => onJobApplicationsPress(job.id) : undefined
                  }
                  manage={
                    clinicId && onJobUpdated && onJobDeleted
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
        liveShifts.length === 0 && confirmedFillIns.length === 0 ? (
          <DashboardEmptyState
            icon="calendar-outline"
            title="No fill-in shifts yet"
            message="Post a fill-in shift when you need temporary coverage."
            accent="secondary"
          />
        ) : (
          <View style={styles.list}>
                {confirmedFillIns.length > 0 ? (
              <View style={styles.subsection}>
                <DashboardSectionHeader title="Upcoming confirmed" compact />
                {confirmedFillIns.map((row) => (
                  <ConfirmedFillInCard
                    key={row.applicationId}
                    workerName={row.workerName}
                    workerPhotoStoragePath={row.workerPhotoStoragePath}
                    shiftDate={row.shiftDate}
                    startTime={row.startTime}
                    endTime={row.endTime}
                    applicationId={row.applicationId}
                    returnTo="dashboard-fill-ins"
                    expanded={expandedConfirmedId === row.applicationId}
                    onExpandChange={(next) =>
                      setExpandedConfirmedId(next ? row.applicationId : null)
                    }
                  />
                ))}
              </View>
            ) : null}
            {liveShifts.length > 0 ? (
              <View style={styles.subsection}>
                {confirmedFillIns.length > 0 ? (
                  <DashboardSectionHeader title="Open fill-ins" compact />
                ) : null}
                {liveShifts.map((shift) => (
                  <FillInPostingCard
                    key={shift.id}
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
            ) : null}
          </View>
        )
      ) : null}

      {selected === 'applications' ? (
        jobApplicationSummaries.length === 0 ? (
          <DashboardEmptyState
            icon="people-outline"
            title="No applications yet"
            message="Applications will appear here when workers apply to your postings."
          />
        ) : (
          <View style={styles.list}>
            {jobApplicationSummaries.map((summary) => {
              const hasNewApplicants = summary.unseen_count > 0;
              return (
                <DashboardListCard
                  key={summary.job_post_id}
                  title={summary.post_title}
                  applicantCount={summary.applicant_count}
                  unseenCount={summary.unseen_count}
                  postedAt={summary.post_created_at}
                  meta={formatJobApplicationSummaryMeta(summary)}
                  highlighted={hasNewApplicants}
                  onPress={
                    onJobApplicationsPress
                      ? () => onJobApplicationsPress(summary.job_post_id)
                      : undefined
                  }
                />
              );
            })}
          </View>
        )
        ) : null}
      </FadeInSection>
    </View>
  );
}
