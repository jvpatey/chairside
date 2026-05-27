import {
  getJobPost,
  listClinicApplicationsForJob,
  type ClinicApplication,
} from '@chairside/api';
import { formatRoleApplicantPipelineSubtitle } from '@chairside/config';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { ApplicantFilterBar } from '@/components/clinic/ApplicantFilterBar';
import { ApplicantPipelineSectionBlock } from '@/components/clinic/ApplicantPipelineSection';
import { ClinicApplicationCard } from '@/components/clinic/ClinicApplicationCard';
import { InterviewScheduleSheet } from '@/components/clinic/InterviewScheduleSheet';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import {
  filterApplicationsByView,
  getApplicantFilterCounts,
  groupApplicationsByPipeline,
  type ApplicantListFilter,
  type ApplicantPipelineSectionId,
} from '@/lib/applicationPipeline';
import { useThemedStyles } from '@/theme';

function formatClinicAddress(profile: {
  address_line1?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
} | null): string | null {
  if (!profile) return null;

  const parts = [
    profile.address_line1?.trim(),
    [profile.city?.trim(), profile.province?.trim()].filter(Boolean).join(', '),
    profile.postal_code?.trim(),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' · ') : null;
}

const FILTER_EMPTY_MESSAGES: Record<Exclude<ApplicantListFilter, 'all'>, string> = {
  shortlisted: 'No shortlisted applicants yet. Add candidates from the All tab.',
  interview: 'No interviews scheduled yet. Schedule one from a shortlisted applicant.',
};

export default function ClinicRoleApplicationsScreen() {
  const { user } = useAuth();
  const { clinicProfile } = useClinicProfile();
  const { jobId } = useLocalSearchParams<{ jobId?: string }>();
  const resolvedJobId = typeof jobId === 'string' ? jobId : '';
  const [postTitle, setPostTitle] = useState('');
  const [applications, setApplications] = useState<ClinicApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listFilter, setListFilter] = useState<ApplicantListFilter>('all');
  const [scheduleTarget, setScheduleTarget] = useState<ClinicApplication | null>(null);
  const [sectionExpanded, setSectionExpanded] = useState<
    Partial<Record<ApplicantPipelineSectionId, boolean>>
  >({});

  const styles = useThemedStyles(({ spacing, typography }) => ({
    content: { gap: spacing.lg },
    sections: { gap: spacing.xl },
    list: { gap: spacing.md },
    empty: typography.subtitle,
  }));

  const load = useCallback(async () => {
    if (!user?.id || !resolvedJobId) {
      setApplications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [job, rows] = await Promise.all([
        getJobPost(user.id, resolvedJobId),
        listClinicApplicationsForJob(user.id, resolvedJobId),
      ]);
      setPostTitle(job?.title ?? 'Role applicants');
      setApplications(rows);
    } catch (error) {
      setApplications([]);
      Alert.alert(
        'Could not load applicants',
        error instanceof Error ? error.message : 'Please try again.',
      );
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [resolvedJobId, user?.id]);

  useRefreshOnFocus(load);

  const filterCounts = useMemo(() => getApplicantFilterCounts(applications), [applications]);

  const sections = useMemo(
    () => groupApplicationsByPipeline(applications),
    [applications],
  );

  const filteredApplications = useMemo(
    () => filterApplicationsByView(applications, listFilter),
    [applications, listFilter],
  );

  const subtitle = useMemo(() => {
    if (isLoading) return 'Loading…';
    return formatRoleApplicantPipelineSubtitle(applications);
  }, [applications, isLoading]);

  const defaultLocation = formatClinicAddress(clinicProfile);
  const clinicName = clinicProfile?.clinic_name?.trim() || 'Your clinic';

  const isSectionExpanded = (sectionId: ApplicantPipelineSectionId, defaultExpanded: boolean) =>
    sectionExpanded[sectionId] ?? defaultExpanded;

  const toggleSection = (sectionId: ApplicantPipelineSectionId, defaultExpanded: boolean) => {
    setSectionExpanded((current) => ({
      ...current,
      [sectionId]: !(current[sectionId] ?? defaultExpanded),
    }));
  };

  const renderApplicationCards = (rows: ClinicApplication[]) =>
    rows.map((application) => (
      <ClinicApplicationCard
        key={application.id}
        application={application}
        onUpdated={() => void load()}
        onScheduleInterview={setScheduleTarget}
      />
    ));

  return (
    <OnboardingShell>
      <AuthScreenHeader
        title={postTitle || 'Role applicants'}
        subtitle={subtitle}
        onBack={() => router.back()}
      />
      <View style={styles.content}>
        {applications.length === 0 && !isLoading ? (
          <Text style={styles.empty}>No applicants for this role yet.</Text>
        ) : (
          <>
            <ApplicantFilterBar
              selected={listFilter}
              counts={filterCounts}
              onChange={setListFilter}
            />

            {listFilter === 'all' ? (
              sections.length === 0 ? (
                <Text style={styles.empty}>No applicants for this role yet.</Text>
              ) : (
                <View style={styles.sections}>
                  {sections.map((section) => (
                    <ApplicantPipelineSectionBlock
                      key={section.id}
                      title={section.title}
                      count={section.applications.length}
                      expanded={isSectionExpanded(section.id, section.defaultExpanded)}
                      collapsible={section.id === 'decided'}
                      onToggle={
                        section.id === 'decided'
                          ? () => toggleSection(section.id, section.defaultExpanded)
                          : undefined
                      }>
                      {renderApplicationCards(section.applications)}
                    </ApplicantPipelineSectionBlock>
                  ))}
                </View>
              )
            ) : filteredApplications.length === 0 ? (
              <Text style={styles.empty}>{FILTER_EMPTY_MESSAGES[listFilter]}</Text>
            ) : (
              <View style={styles.list}>{renderApplicationCards(filteredApplications)}</View>
            )}
          </>
        )}
      </View>

      {scheduleTarget ? (
        <InterviewScheduleSheet
          visible
          application={scheduleTarget}
          clinicName={clinicName}
          defaultLocation={defaultLocation}
          onScheduled={() => void load()}
          onClose={() => setScheduleTarget(null)}
        />
      ) : null}
    </OnboardingShell>
  );
}
