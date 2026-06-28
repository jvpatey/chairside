import type { LiveJobPost, LiveShiftPost, PublicClinicProfile } from '@chairside/api';
import { formatJobPostCardMeta, getSpecialtyLabel, getTeamSizeRangeLabel } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Linking, Pressable, Text, View } from 'react-native';

import { DetailProse } from '@/components/clinic/DetailCard';
import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader';
import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import {
  FieldBlock,
  FieldDivider,
  FieldValue,
  ProfileDetailStack,
  SectionPanel,
} from '@/components/profile/ProfileDetailBlocks';
import { ClinicLocationCard } from '@/components/worker/ClinicLocationCard';
import { PracticeDoctorList } from '@/components/clinic/PracticeDoctorList';
import { CardInfoPanel, CardInfoPanelText } from '@/components/ui/CardInfoPanel';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import { formatShiftPostMeta, formatShiftPostRoleTitle } from '@/lib/shiftPostDisplay';
import { webHover, webPointer, webTextLinkHoverStyles } from '@/lib/webPressableStyles';
import { fontSemibold, useTheme, useThemedStyles } from '@/theme';

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
  const location = [profile.city, profile.province].filter(Boolean).join(', ');
  const specialtyLabel = getSpecialtyLabel(profile.specialty);
  const teamSizeLabel = getTeamSizeRangeLabel(profile.team_size_range);
  const softwareLabel =
    profile.software_used.length > 0 ? profile.software_used.join(' · ') : null;
  const description = profile.description?.trim() || null;
  const hasAbout = Boolean(description || profile.website?.trim());
  const practiceDoctors = profile.practice_doctors ?? [];
  const hasDoctors = practiceDoctors.length > 0;
  const hasPracticeDetails = Boolean(teamSizeLabel || softwareLabel);
  const acceptsGeneralMessages = profile.accepts_general_candidate_messages;
  const hasNoPostings = jobs.length === 0 && shifts.length === 0;
  const showGeneralMessageHint = acceptsGeneralMessages && hasNoPostings;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    stack: {
      gap: spacing.lg,
    },
    hero: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      gap: spacing.md,
    },
    heroTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    heroIdentity: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
    },
    clinicName: {
      ...typography.title,
      fontSize: 24,
      lineHeight: 30,
      color: colors.labelPrimary,
    },
    location: {
      ...typography.body,
      fontSize: 15,
      lineHeight: 21,
      color: colors.labelSecondary,
    },
    specialty: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    sectionBlock: {
      gap: spacing.sm,
    },
    emptyCard: {
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.xl,
    },
    emptyIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.fillSubtle,
    },
    emptyTitle: {
      ...typography.body,
      fontFamily: fontSemibold,
      fontWeight: '600',
      textAlign: 'center',
      color: colors.labelPrimary,
    },
    emptyBody: {
      ...typography.subtitle,
      textAlign: 'center',
    },
  }));

  return (
    <View style={styles.stack}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <ClinicLogoAvatar clinicName={profile.clinic_name} logoUri={logoUri} size={64} />
          <View style={styles.heroIdentity}>
            <Text style={styles.clinicName} numberOfLines={3}>
              {profile.clinic_name}
            </Text>
            {location ? (
              <Text style={styles.location} numberOfLines={2}>
                {location}
              </Text>
            ) : null}
            <Text style={styles.specialty} numberOfLines={2}>
              {specialtyLabel}
            </Text>
          </View>
        </View>
      </View>

      {showGeneralMessageHint ? (
        <CardInfoPanel variant="info" icon="chatbubble-ellipses-outline" title="Open to inquiries">
          <CardInfoPanelText>
            This clinic accepts general messages from candidates, even without an open role or fill-in.
            Use Message clinic below to introduce yourself.
          </CardInfoPanelText>
        </CardInfoPanel>
      ) : null}

      <ClinicLocationCard profile={profile} />

      {hasAbout ? (
        <ProfileDetailStack>
          <SectionPanel icon="document-text-outline" title="About">
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
        </ProfileDetailStack>
      ) : null}

      {hasDoctors ? (
        <ProfileDetailStack>
          <SectionPanel icon="people-outline" title="Doctors">
            <PracticeDoctorList doctors={practiceDoctors} />
          </SectionPanel>
        </ProfileDetailStack>
      ) : null}

      {hasPracticeDetails ? (
        <ProfileDetailStack>
          <SectionPanel icon="medkit-outline" title="Practice">
            {teamSizeLabel ? (
              <FieldBlock label="Team size">
                <FieldValue value={teamSizeLabel} />
              </FieldBlock>
            ) : null}
            {teamSizeLabel && softwareLabel ? <FieldDivider /> : null}
            {softwareLabel ? (
              <FieldBlock label="Software">
                <FieldValue value={softwareLabel} />
              </FieldBlock>
            ) : null}
          </SectionPanel>
        </ProfileDetailStack>
      ) : null}

      <View style={styles.sectionBlock}>
        <DashboardSectionHeader title="Open roles" compact />
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <ClinicProfileJobRow key={job.id} job={job} onPress={() => onJobPress(job.id)} />
          ))
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="briefcase-outline" size={22} color={styles.specialty.color} />
            </View>
            <Text style={styles.emptyTitle}>No open roles right now</Text>
            <Text style={styles.emptyBody}>
              {acceptsGeneralMessages
                ? 'No roles are posted, but you can still message this clinic if you are interested in working there.'
                : 'Check back later for new opportunities.'}
            </Text>
          </View>
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
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="calendar-outline" size={22} color={styles.specialty.color} />
            </View>
            <Text style={styles.emptyTitle}>No open fill-ins right now</Text>
            <Text style={styles.emptyBody}>
              {acceptsGeneralMessages
                ? 'No fill-ins are posted, but you can still message this clinic about future opportunities.'
                : 'This clinic has no upcoming shifts posted.'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
