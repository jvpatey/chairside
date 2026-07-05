import type { LiveJobPost, LiveShiftPost, PublicClinicProfile } from '@chairside/api';
import { formatJobPostCardMeta, getProvinceLabel, getSpecialtyLabel, getTeamSizeRangeLabel } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Linking, Pressable, Text, View } from 'react-native';

import { DetailProse } from '@/components/clinic/DetailCard';
import { ClinicIdentityHeroCard } from '@/components/clinic/ClinicProfileHero';
import { PracticeDoctorList } from '@/components/clinic/PracticeDoctorList';
import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader';
import {
  FieldBlock,
  FieldDivider,
  FieldValue,
  ProfileDetailStack,
  ProfileEmptyState,
  ProfileTagRow,
  SectionPanel,
} from '@/components/profile/ProfileDetailBlocks';
import { CardInfoPanel, CardInfoPanelText } from '@/components/ui/CardInfoPanel';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { ClinicLocationCard } from '@/components/worker/ClinicLocationCard';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import { formatShiftPostMeta, formatShiftPostRoleTitle } from '@/lib/shiftPostDisplay';
import { webHover, webPointer, webTextLinkHoverStyles } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type WorkerPublicClinicProfileViewProps = {
  profile: PublicClinicProfile;
  jobs: LiveJobPost[];
  shifts: LiveShiftPost[];
  onJobPress: (jobId: string) => void;
  onShiftPress: (shiftId: string) => void;
};

function normalizeWebsiteUrl(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function WebsiteField({ url }: { url: string | null | undefined }) {
  const trimmed = url?.trim();

  const styles = useThemedStyles(({ colors }) => ({
    linkPressable: {
      alignSelf: 'flex-start',
      borderRadius: 8,
      ...webPointer(),
    },
    linkHovered: webTextLinkHoverStyles(colors),
    link: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.primary,
    },
  }));

  const handlePress = async () => {
    if (!trimmed) return;

    try {
      await Linking.openURL(normalizeWebsiteUrl(trimmed));
    } catch {
      Alert.alert('Cannot open link', 'Please check the website URL and try again.');
    }
  };

  if (!trimmed) {
    return <FieldValue value={null} />;
  }

  return (
    <Pressable
      accessibilityRole="link"
      onPress={handlePress}
      style={({ pressed, hovered }) => [
        styles.linkPressable,
        webHover(hovered, pressed, styles.linkHovered),
        pressed && { opacity: 0.75 },
      ]}>
      <Text style={styles.link}>{trimmed.replace(/^https?:\/\//i, '')}</Text>
    </Pressable>
  );
}

function ClinicProfileJobRow({
  job,
  onPress,
}: {
  job: LiveJobPost;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    content: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
    },
    chevron: {
      flexShrink: 0,
      marginTop: 2,
    },
    title: {
      ...typography.body,
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '700',
      color: colors.labelPrimary,
    },
    meta: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
    },
    wage: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
      marginTop: spacing.xs,
    },
  }));

  const meta = formatJobPostCardMeta(job);

  return (
    <SurfaceCard onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {job.title}
          </Text>
          {meta ? (
            <Text style={styles.meta} numberOfLines={2}>
              {meta}
            </Text>
          ) : null}
          {job.wage_range ? <Text style={styles.wage}>{job.wage_range}</Text> : null}
        </View>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.labelTertiary}
          style={styles.chevron}
        />
      </View>
    </SurfaceCard>
  );
}

function ClinicProfileShiftRow({
  shift,
  onPress,
}: {
  shift: LiveShiftPost;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    content: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
    },
    chevron: {
      flexShrink: 0,
      marginTop: 2,
    },
    title: {
      ...typography.body,
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '700',
      color: colors.labelPrimary,
    },
    meta: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
    },
    compensation: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
      marginTop: spacing.xs,
    },
  }));

  const meta = formatShiftPostMeta(shift);

  return (
    <SurfaceCard onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {formatShiftPostRoleTitle(shift.role_type)}
          </Text>
          {meta ? (
            <Text style={styles.meta} numberOfLines={2}>
              {meta}
            </Text>
          ) : null}
          {shift.compensation ? (
            <Text style={styles.compensation}>{shift.compensation}</Text>
          ) : null}
        </View>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.labelTertiary}
          style={styles.chevron}
        />
      </View>
    </SurfaceCard>
  );
}

export function WorkerPublicClinicProfileView({
  profile,
  jobs,
  shifts,
  onJobPress,
  onShiftPress,
}: WorkerPublicClinicProfileViewProps) {
  const logoUri = useClinicLogoUri(profile.logo_storage_path);
  const locationLabel = [profile.city, getProvinceLabel(profile.province)].filter(Boolean).join(', ');
  const specialtyLabel = getSpecialtyLabel(profile.specialty);
  const teamSizeLabel = getTeamSizeRangeLabel(profile.team_size_range);
  const softwareUsed = profile.software_used ?? [];
  const description = profile.description?.trim() || null;
  const hasAbout = Boolean(description || profile.website?.trim());
  const practiceDoctors = profile.practice_doctors ?? [];
  const hasDoctors = practiceDoctors.length > 0;
  const hasPracticeDetails = Boolean(teamSizeLabel || softwareUsed.length > 0 || hasDoctors);
  const acceptsGeneralMessages = profile.accepts_general_candidate_messages;
  const hasNoPostings = jobs.length === 0 && shifts.length === 0;
  const showGeneralMessageHint = acceptsGeneralMessages && hasNoPostings;

  let sectionStep = 1;
  const aboutStep = hasAbout ? sectionStep++ : null;
  const locationStep = sectionStep++;
  const practiceStep = hasPracticeDetails ? sectionStep++ : null;

  const styles = useThemedStyles(({ spacing }) => ({
    sectionBlock: {
      gap: spacing.sm,
    },
    doctorsBlock: {
      gap: spacing.sm,
    },
  }));

  return (
    <ProfileDetailStack>
      <ClinicIdentityHeroCard
        clinicName={profile.clinic_name}
        logoUri={logoUri}
        specialtyLabel={specialtyLabel}
        locationLabel={locationLabel || null}
      />

      {showGeneralMessageHint ? (
        <CardInfoPanel variant="info" icon="chatbubble-ellipses-outline" title="Open to inquiries">
          <CardInfoPanelText>
            This clinic accepts general messages from candidates, even without an open role or fill-in.
            Use Message clinic below to introduce yourself.
          </CardInfoPanelText>
        </CardInfoPanel>
      ) : null}

      {hasAbout ? (
        <SectionPanel
          icon="document-text-outline"
          stepNumber={aboutStep!}
          stepAccent="secondary"
          title="About">
          {description ? (
            <>
              <FieldBlock label="Description">
                <DetailProse text={description} />
              </FieldBlock>
              {profile.website?.trim() ? (
                <>
                  <FieldDivider />
                  <FieldBlock label="Website">
                    <WebsiteField url={profile.website} />
                  </FieldBlock>
                </>
              ) : null}
            </>
          ) : (
            <FieldBlock label="Website">
              <WebsiteField url={profile.website} />
            </FieldBlock>
          )}
        </SectionPanel>
      ) : null}

      <ClinicLocationCard
        profile={profile}
        stepNumber={locationStep}
        stepAccent="secondary"
      />

      {hasPracticeDetails ? (
        <SectionPanel
          icon="medkit-outline"
          stepNumber={practiceStep!}
          stepAccent="primary"
          title="Practice">
          <FieldBlock label="Specialty">
            <FieldValue value={specialtyLabel} />
          </FieldBlock>
          {teamSizeLabel ? (
            <>
              <FieldDivider />
              <FieldBlock label="Team size">
                <FieldValue value={teamSizeLabel} />
              </FieldBlock>
            </>
          ) : null}
          {softwareUsed.length > 0 ? (
            <>
              <FieldDivider />
              <FieldBlock label="Software">
                <ProfileTagRow tags={softwareUsed} />
              </FieldBlock>
            </>
          ) : null}
          {hasDoctors ? (
            <>
              <FieldDivider />
              <FieldBlock label="Doctors">
                <View style={styles.doctorsBlock}>
                  <PracticeDoctorList doctors={practiceDoctors} />
                </View>
              </FieldBlock>
            </>
          ) : null}
        </SectionPanel>
      ) : null}

      <View style={styles.sectionBlock}>
        <DashboardSectionHeader title="Open roles" compact />
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <ClinicProfileJobRow key={job.id} job={job} onPress={() => onJobPress(job.id)} />
          ))
        ) : (
          <ProfileEmptyState
            icon="briefcase-outline"
            title="No open roles right now"
            description={
              acceptsGeneralMessages
                ? 'No roles are posted, but you can still message this clinic if you are interested in working there.'
                : 'Check back later for new opportunities.'
            }
          />
        )}
      </View>

      <View style={styles.sectionBlock}>
        <DashboardSectionHeader title="Open fill-ins" compact />
        {shifts.length > 0 ? (
          shifts.map((shift) => (
            <ClinicProfileShiftRow
              key={shift.id}
              shift={shift}
              onPress={() => onShiftPress(shift.id)}
            />
          ))
        ) : (
          <ProfileEmptyState
            icon="calendar-outline"
            title="No open fill-ins right now"
            description={
              acceptsGeneralMessages
                ? 'No fill-ins are posted, but you can still message this clinic about future opportunities.'
                : 'This clinic has no upcoming shifts posted.'
            }
          />
        )}
      </View>
    </ProfileDetailStack>
  );
}
