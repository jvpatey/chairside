import {
  getJobPost,
  getUnreadConversationMap,
  listClinicApplicationsForJob,
  type ClinicApplication,
} from '@chairside/api';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, View } from 'react-native';

import { ApplicantFilterBar } from '@/components/clinic/ApplicantFilterBar';
import { ApplicantPipelineSectionBlock } from '@/components/clinic/ApplicantPipelineSection';
import { ClinicApplicationCard } from '@/components/clinic/ClinicApplicationCard';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { FormScreen } from '@/components/ui/FormScreen';
import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListSearchFilterRow } from '@/components/ui/ListSearchFilterRow';
import { PageLoadingList } from '@/components/ui/PageLoadingState';
import { StaggeredList } from '@/components/ui/StaggeredList';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicUpgradePrompt } from '@/hooks/useClinicUpgradePrompt';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import {
  APPLICANT_FILTER_SECTION_TITLES,
  filterApplicationsByView,
  getApplicantFilterCounts,
  groupApplicationsByPipeline,
  type ApplicantListFilter,
  type ApplicantPipelineSectionId,
} from '@/lib/applicationPipeline';
import { getClinicCalendarRoute } from '@/lib/calendarNavigation';
import { hasActiveListSearch, matchesClinicApplicationSearch } from '@/lib/clinicListSearch';
import { formatPostedDateLabel } from '@/lib/dates';
import { webScrollbarStyles } from '@/lib/webScrollbarStyles';
import type { ClinicApplicationReturnTarget } from '@/lib/routing';
import { useThemedStyles } from '@/theme';

const FILTER_EMPTY_MESSAGES: Record<Exclude<ApplicantListFilter, 'all'>, string> = {
  screening: 'No screening submissions yet. They appear here when candidates complete screening questions.',
  shortlisted: 'No shortlisted applicants yet. Add candidates from the All tab.',
  interview: 'No interview invitations yet. Send one from a shortlisted applicant.',
  decided: 'No decided applicants yet. Mark applicants as hired or not moving forward.',
  follow_up:
    "No follow-up reminders yet. Add a follow-up date from an applicant's private notes.",
};

type ClinicRoleApplicantsPanelProps = {
  jobId: string;
  returnTo?: ClinicApplicationReturnTarget;
  /** Embed in master/detail without full-page chrome. */
  embedded?: boolean;
  onBack?: () => void;
  onLoadError?: () => void;
};

export function ClinicRoleApplicantsPanel({
  jobId,
  returnTo,
  embedded = false,
  onBack,
  onLoadError,
}: ClinicRoleApplicantsPanelProps) {
  const { user } = useAuth();
  const { billing, upgradePrompt, showCrmUpgrade } = useClinicUpgradePrompt();
  const crmLocked = billing != null && !billing.canUseCrmFollowups;

  const [postTitle, setPostTitle] = useState('');
  const [postPostedLabel, setPostPostedLabel] = useState('');
  const [applications, setApplications] = useState<ClinicApplication[]>([]);
  const [archivedApplications, setArchivedApplications] = useState<ClinicApplication[]>([]);
  const [unreadMap, setUnreadMap] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [listFilter, setListFilter] = useState<ApplicantListFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [archivedExpanded, setArchivedExpanded] = useState(false);
  const [sectionExpanded, setSectionExpanded] = useState<
    Partial<Record<ApplicantPipelineSectionId, boolean>>
  >({});

  const styles = useThemedStyles(({ colors, spacing }) => ({
    root: { flex: 1, minHeight: 0 },
    embeddedShell: {
      flex: 1,
      minHeight: 0,
      alignSelf: 'stretch',
      backgroundColor: colors.background,
    },
    embeddedHeader: {
      flexShrink: 0,
      paddingHorizontal: spacing.lg,
      paddingTop: Platform.OS === 'web' ? spacing.lg : spacing.md,
      paddingBottom: spacing.sm,
    },
    embeddedScroll: {
      flex: 1,
      minHeight: 0,
      ...webScrollbarStyles(),
    },
    content: {
      gap: spacing.md,
      paddingTop: spacing.xs,
      paddingBottom: spacing.xxl,
    },
    contentFill: {
      flexGrow: 1,
    },
    filterAndSections: { gap: spacing.md },
    filterAndSectionsEmbedded: { flex: 1, minHeight: 0 },
    filterEmpty: {
      flex: 1,
      minHeight: 220,
      justifyContent: 'center',
    },
    sections: { gap: spacing.lg },
    embeddedPad: { paddingHorizontal: spacing.lg },
  }));

  const load = useCallback(async () => {
    if (!user?.id || !jobId) {
      setApplications([]);
      setArchivedApplications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [job, rows, archived, unread] = await Promise.all([
        getJobPost(user.id, jobId),
        listClinicApplicationsForJob(user.id, jobId, 'active'),
        listClinicApplicationsForJob(user.id, jobId, 'archived'),
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
      onLoadError?.();
      onBack?.();
    } finally {
      setIsLoading(false);
    }
  }, [jobId, onBack, onLoadError, user?.id]);

  useRefreshOnFocus(load);

  // Reset filters when switching roles in the embedded panel
  useEffect(() => {
    setListFilter('all');
    setSearchQuery('');
    setArchivedExpanded(false);
    setSectionExpanded({});
  }, [jobId]);

  const searchedApplications = useMemo(
    () => applications.filter((application) => matchesClinicApplicationSearch(application, searchQuery)),
    [applications, searchQuery],
  );

  const filterCounts = useMemo(
    () => getApplicantFilterCounts(searchedApplications),
    [searchedApplications],
  );

  const searchedArchivedApplications = useMemo(
    () =>
      archivedApplications.filter((application) =>
        matchesClinicApplicationSearch(application, searchQuery),
      ),
    [archivedApplications, searchQuery],
  );

  const sections = useMemo(
    () => groupApplicationsByPipeline(searchedApplications),
    [searchedApplications],
  );

  const filteredApplications = useMemo(
    () => filterApplicationsByView(searchedApplications, listFilter),
    [searchedApplications, listFilter],
  );

  const scheduledInterviewCount = useMemo(
    () => searchedApplications.filter((application) => application.status === 'interview_scheduled').length,
    [searchedApplications],
  );

  const hasSearch = hasActiveListSearch(searchQuery);

  const isSectionExpanded = (sectionId: ApplicantPipelineSectionId, defaultExpanded: boolean) =>
    sectionExpanded[sectionId] ?? defaultExpanded;

  const toggleSection = (sectionId: ApplicantPipelineSectionId, defaultExpanded: boolean) => {
    setSectionExpanded((current) => ({
      ...current,
      [sectionId]: !(current[sectionId] ?? defaultExpanded),
    }));
  };

  const renderApplicationCards = (rows: ClinicApplication[]) => (
    <StaggeredList>
      {rows.map((application) => (
        <ClinicApplicationCard
          key={application.id}
          application={application}
          returnTo={returnTo ?? 'applications-tab'}
          roleJobId={embedded ? undefined : jobId}
          selectJobId={embedded ? jobId : undefined}
          hasUnreadMessages={Boolean(unreadMap[application.id])}
        />
      ))}
    </StaggeredList>
  );

  const hasAnyApplicants = applications.length > 0 || archivedApplications.length > 0;
  const hasVisibleApplicants =
    searchedApplications.length > 0 || searchedArchivedApplications.length > 0;

  const renderArchivedSection = () =>
    searchedArchivedApplications.length === 0 ? null : (
      <ApplicantPipelineSectionBlock
        title="Archived"
        count={searchedArchivedApplications.length}
        expanded={archivedExpanded}
        collapsible
        onToggle={() => setArchivedExpanded((current) => !current)}>
        {renderApplicationCards(searchedArchivedApplications)}
      </ApplicantPipelineSectionBlock>
    );

  const renderFilteredTabContent = () => {
    if (listFilter === 'all') return null;

    const sectionTitle = APPLICANT_FILTER_SECTION_TITLES[listFilter];

    if (filteredApplications.length === 0) {
      return (
        <View style={embedded ? styles.filterEmpty : undefined}>
          <EmptyState
            embedded={embedded}
            fill={embedded}
            accent="tertiary"
            icon="people-outline"
            title={`No ${sectionTitle.toLowerCase()} applicants`}
            message={FILTER_EMPTY_MESSAGES[listFilter]}
          />
        </View>
      );
    }

    return (
      <View style={styles.sections}>
        {listFilter === 'interview' && scheduledInterviewCount > 0 ? (
          <DashboardSectionHeader
            title={`${scheduledInterviewCount} scheduled interview${scheduledInterviewCount === 1 ? '' : 's'}`}
            actionLabel="View calendar"
            onActionPress={() => router.push(getClinicCalendarRoute())}
            compact
          />
        ) : null}
        <ApplicantPipelineSectionBlock
          title={sectionTitle}
          count={filteredApplications.length}
          expanded>
          {renderApplicationCards(filteredApplications)}
        </ApplicantPipelineSectionBlock>
        {listFilter === 'decided' ? renderArchivedSection() : null}
      </View>
    );
  };

  const body = (
    <View>
      {isLoading ? (
        <PageLoadingList />
      ) : !hasAnyApplicants ? (
        <EmptyState
          icon="people-outline"
          title="No applicants yet"
          message="No applicants for this role yet."
        />
      ) : !hasVisibleApplicants ? (
        <EmptyState
          icon={hasSearch ? 'search-outline' : 'people-outline'}
          title={hasSearch ? 'No matching applicants' : 'No applicants yet'}
          message={
            hasSearch ? 'No applicants match your search.' : 'No applicants for this role yet.'
          }
        />
      ) : (
        <View
          style={[
            styles.filterAndSections,
            embedded ? styles.filterAndSectionsEmbedded : null,
          ]}>
          <ListSearchFilterRow
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search applicant name"
            accessibilityLabel="Search applicants"
          />
          <ApplicantFilterBar
            selected={listFilter}
            counts={filterCounts}
            onChange={setListFilter}
            lockedFilters={crmLocked ? ['follow_up'] : undefined}
            onLockedFilterPress={() => showCrmUpgrade()}
          />

          {listFilter === 'all' ? (
            sections.length === 0 ? (
              <>
                <View style={embedded ? styles.filterEmpty : undefined}>
                  <EmptyState
                    embedded={embedded}
                    fill={embedded}
                    accent="tertiary"
                    icon="people-outline"
                    title="No active applicants"
                    message="No active applicants for this role."
                  />
                </View>
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
          ) : (
            renderFilteredTabContent()
          )}
        </View>
      )}
    </View>
  );

  if (embedded) {
    const scrollContentStyle = [styles.content, styles.contentFill];

    return (
      <>
        {upgradePrompt}
        <View style={styles.embeddedShell}>
          <View style={styles.embeddedHeader}>
            <AuthScreenHeader
              eyebrow="Applications for"
              title={postTitle || 'Role'}
              subtitle={postPostedLabel || undefined}
              accent="tertiary"
              compact
            />
          </View>
          <ScrollView
            style={styles.embeddedScroll}
            contentContainerStyle={scrollContentStyle}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.embeddedPad}>{body}</View>
          </ScrollView>
        </View>
      </>
    );
  }

  return (
    <>
      {upgradePrompt}
      <FormScreen
        eyebrow="Applications for"
        title={postTitle || 'Role'}
        subtitle={postPostedLabel || undefined}
        accent="tertiary"
        onBack={onBack}>
        {body}
      </FormScreen>
    </>
  );
}
