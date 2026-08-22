import type { WorkerProfile } from '@chairside/api';
import { getWorkerRoleTypes } from '@chairside/api';
import {
  formatWorkerAddress,
  formatWorkerEducation,
  formatRoleTypesLabel,
  getSpecialtyLabel,
} from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { DetailProse } from '@/components/clinic/DetailCard';
import {
  FieldBlock,
  FieldDivider,
  FieldValue,
  ProfileDetailStack,
  profileSettingsHintStyle,
} from '@/components/profile/ProfileDetailBlocks';
import { ProfileSettingsCard } from '@/components/profile/ProfileSettingsCard';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { fontBold, useTheme, useThemedStyles } from '@/theme';

type ApplicationPackagePreviewProps = {
  profile: WorkerProfile;
  displayName?: string | null;
  photoUri?: string | null;
  showDefaultNote?: boolean;
  /** When set, preview reflects this application-specific note instead of the saved profile default. */
  coverNote?: string | null;
};

export function ApplicationPackagePreview({
  profile,
  displayName,
  photoUri,
  showDefaultNote = true,
  coverNote,
}: ApplicationPackagePreviewProps) {
  const { colors } = useTheme();

  const styles = useThemedStyles(({ colors, spacing, typography, radii }) => ({
    candidateCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      padding: spacing.lg,
    },
    candidateRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    identity: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
      paddingTop: spacing.xs,
    },
    candidateLabel: profileSettingsHintStyle({ typography, colors }),
    name: {
      fontSize: 22,
      lineHeight: 28,
      fontFamily: fontBold,
      fontWeight: '700',
      letterSpacing: -0.35,
      color: colors.labelPrimary,
    },
    role: {
      ...typography.body,
      fontSize: 15,
      lineHeight: 21,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingTop: spacing.xs,
    },
    meta: profileSettingsHintStyle({ typography, colors }),
    resumeTitle: {
      ...typography.body,
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    resumeMeta: profileSettingsHintStyle({ typography, colors }),
  }));

  const rolesLabel = formatRoleTypesLabel(getWorkerRoleTypes(profile)) || null;
  const locationLabel = formatWorkerAddress(profile);
  const experienceLabel =
    profile.years_of_experience != null ? `${profile.years_of_experience} years` : null;
  const educationLabel = formatWorkerEducation(profile);
  const softwareLabel = profile.software_used.length > 0 ? profile.software_used.join(', ') : null;
  const specialtiesLabel =
    profile.practice_types.length > 0
      ? profile.practice_types.map(getSpecialtyLabel).join(', ')
      : null;
  const profileCoverNote = profile.default_cover_message?.trim();
  const applicationCoverNote = coverNote != null ? coverNote.trim() : undefined;
  const displayedCoverNote = applicationCoverNote ?? profileCoverNote ?? '';
  const showCoverNoteSection =
    showDefaultNote &&
    (coverNote !== undefined ? Boolean(applicationCoverNote) : true);
  const coverNoteTitle = coverNote !== undefined ? 'Message for clinic' : 'Cover note';
  const resumeName = profile.resume_file_name ?? 'PDF attached';

  return (
    <ProfileDetailStack>
      <View style={styles.candidateCard}>
        <View style={styles.candidateRow}>
          <WorkerProfileAvatar displayName={displayName} photoUri={photoUri} size={64} />
          <View style={styles.identity}>
            <Text style={styles.candidateLabel}>Candidate</Text>
            <Text style={styles.name} numberOfLines={2}>
              {displayName?.trim() || 'Your name'}
            </Text>
            <Text style={styles.role} numberOfLines={2}>
              {rolesLabel || 'Add your roles in professional background'}
            </Text>
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={14} color={colors.labelSecondary} />
              <Text style={styles.meta} numberOfLines={2}>
                {locationLabel || 'Add your location in professional background'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ProfileSettingsCard title="Experience" icon="ribbon-outline" iconAccent="tertiary">
        <FieldBlock label="Years">
          <FieldValue value={experienceLabel} />
        </FieldBlock>
        <FieldDivider />
        <FieldBlock label="Education">
          <FieldValue value={educationLabel} />
        </FieldBlock>
        <FieldDivider />
        <FieldBlock label="Software">
          <FieldValue value={softwareLabel} />
        </FieldBlock>
        <FieldDivider />
        <FieldBlock label="Practice types">
          <FieldValue value={specialtiesLabel} />
        </FieldBlock>
      </ProfileSettingsCard>

      {showCoverNoteSection ? (
        <ProfileSettingsCard title={coverNoteTitle} icon="chatbubble-ellipses-outline" iconAccent="tertiary">
          {displayedCoverNote ? (
            <DetailProse text={displayedCoverNote} />
          ) : (
            <FieldValue value={null} />
          )}
        </ProfileSettingsCard>
      ) : null}

      <ProfileSettingsCard title="Resume" icon="document-text-outline" iconAccent="tertiary">
        {profile.resume_storage_path ? (
          <>
            <Text style={styles.resumeTitle} numberOfLines={2}>
              {resumeName}
            </Text>
            <Text style={styles.resumeMeta}>PDF resume attached</Text>
          </>
        ) : (
          <FieldValue value={null} />
        )}
      </ProfileSettingsCard>
    </ProfileDetailStack>
  );
}
