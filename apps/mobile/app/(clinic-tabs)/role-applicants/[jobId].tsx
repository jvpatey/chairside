import {
  getJobPost,
  getUnreadConversationMap,
  listClinicApplicationsForJob,
  type ClinicApplication,
} from '@chairside/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { ApplicantFilterBar } from '@/components/clinic/ApplicantFilterBar';
import { ApplicantPipelineSectionBlock } from '@/components/clinic/ApplicantPipelineSection';
import { ClinicApplicationCard } from '@/components/clinic/ClinicApplicationCard';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { PageLoadingList } from '@/components/ui/PageLoadingState';
import { useAuth } from '@/contexts/AuthContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import {
  filterApplicationsByView,
  getApplicantFilterCounts,
  groupApplicationsByPipeline,
  type ApplicantListFilter,
  type ApplicantPipelineSectionId,
} from '@/lib/applicationPipeline';
import { navigateAfterRoleApplicants } from '@/lib/routing';
import { formatPostedDateLabel } from '@/lib/dates';
import { useThemedStyles } from '@/theme';

const FILTER_EMPTY_MESSAGES: Record<Exclude<ApplicantListFilter, 'all'>, string> = {
  screening: 'No screening submissions yet. They appear here when candidates complete screening questions.',
  shortlisted: 'No shortlisted applicants yet. Add candidates from the All tab.',
  interview: 'No interview invitations yet. Send one from a shortlisted applicant.',
  decided: 'No decided applicants yet. Mark applicants as hired or not moving forward.',
  follow_up:
    'No follow-up reminders yet. Add a follow-up date from an applicant’s private notes.',
};

export default function ClinicRoleApplicationsScreen() {
  const { user } = useAuth();
  const { jobId, returnTo } = useLocalSearchParams<{
    jobId?: string;
    returnTo?: string;
  }>();
  const resolvedJobId = typeof jobId === 'string' ? jobId : '';
  const resolvedReturnTo = typeof returnTo === 'string' ? returnTo : undefined;

  const goBack = useCallback(() => {
    navigateAfterRoleApplicants(router, resolvedReturnTo);
  }, [resolvedReturnTo]);
  const [postTitle, setPostTitle] = useState('');
  const [postPostedLabel, setPostPostedLabel] = useState('');
  const [applications, setApplications] = useState<ClinicApplication[]>([]);
  const [archivedApplications, setArchivedApplications] = useState<ClinicApplication[]>([]);
  const [unreadMap, setUnreadMap] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [listFilter, setListFilter] = useState<ApplicantListFilter>('all');
  const [archivedExpanded, setArchivedExpanded] = useState(false);
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
      setArchivedApplications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [job, rows, archived, unread] = await Promise.all([
        getJobPost(user.id, resolvedJobId),
        listClinicApplicationsForJob(user.id, resolvedJobId, 'active'),
        listClinicApplicationsForJob(user.id, resolvedJobId, 'archived'),
        getUnreadConversationMap(user.id, 'clinic'),
      ]);
      setPostTitle(job?.title ?? 'Role applicants');
      setPostPostedLabel(formatPostedDateLabel(job?.created_at));
      setApplications(rows);
      setArchivedApplications(archived);
      setUnreadMap(unread);
    } catch (error) {
      setApplications([]);
      setArchivedApplications([]);
      Alert.alert(
        'Could not load applicants',
        error instanceof Error ? error.message : 'Please try again.',
      );
      goBack();
    } finally {
      setIsLoading(false);
    }
  }, [goBack, resolvedJobId, user?.id]);

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
        returnTo={resolvedReturnTo ?? 'applications-tab'}
        roleJobId={resolvedJobId}
        hasUnreadMessages={Boolean(unreadMap[application.id])}
      />
    ));

  const hasAnyApplicants = applications.length > 0 || archivedApplications.length > 0;

  const renderArchivedSection = () =>
    archivedApplications.length === 0 ? null : (
      <ApplicantPipelineSectionBlock
        title="Archived"
        count={archivedApplications.length}
        expanded={archivedExpanded}
        collapsible
        onToggle={() => setArchivedExpanded((current) => !current)}>
        {renderApplicationCards(archivedApplications)}
      </ApplicantPipelineSectionBlock>
    );

  return (
    <OnboardingShell>
      <AuthScreenHeader
        eyebrow="Applications for"
        title={postTitle || 'Role'}
        subtitle={postPostedLabel || undefined}
        onBack={goBack}
      />
      <View style={styles.content}>
        {isLoading ? (
          <PageLoadingList />
        ) : !hasAnyApplicants ? (
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
                <>
                  <Text style={styles.empty}>No active applicants for this role.</Text>
                  {renderArchivedSection()}
                </>
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
                  {renderArchivedSection()}
                </View>
              )
            ) : filteredApplications.length === 0 ? (
              <View style={styles.sections}>
                <Text style={styles.empty}>{FILTER_EMPTY_MESSAGES[listFilter]}</Text>
                {listFilter === 'decided' ? renderArchivedSection() : null}
              </View>
            ) : (
              <View style={styles.sections}>
                <View style={styles.list}>{renderApplicationCards(filteredApplications)}</View>
                {listFilter === 'decided' ? renderArchivedSection() : null}
              </View>
            )}
          </>
        )}
      </View>
    </OnboardingShell>
  );
}
