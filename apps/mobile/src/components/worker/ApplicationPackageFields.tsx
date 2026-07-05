import type { WorkerProfile } from '@chairside/api';
import { getWorkerRoleTypes } from '@chairside/api';
import {
  formatWorkerAddress,
  formatWorkerEducation,
  formatRoleTypesLabel,
  getSpecialtyLabel,
} from '@chairside/config';
import { Text, View } from 'react-native';

import { ApplicationPreviewGroup } from '@/components/worker/ApplicationPreviewGroup';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { useThemedStyles } from '@/theme';

type ApplicationPreviewFieldProps = {
  label: string;
  value?: string | null;
  emptyLabel?: string;
  /** When true, question-style labels keep normal casing instead of uppercase. */
  preserveLabelCase?: boolean;
  layout?: 'stacked' | 'inline';
};

export function ApplicationPreviewField({
  label,
  value,
  emptyLabel = 'Not set',
  preserveLabelCase = false,
  layout = 'stacked',
}: ApplicationPreviewFieldProps) {
  const trimmed = value?.trim();
  const isEmpty = !trimmed;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    field: { gap: 2 },
    inlineRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'baseline',
      gap: spacing.xs,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.3,
      textTransform: preserveLabelCase ? 'none' : 'uppercase',
      color: colors.labelSecondary,
    },
    inlineLabel: {
      textTransform: 'none',
    },
    value: {
      ...typography.body,
      fontSize: 15,
      lineHeight: 21,
      color: colors.labelPrimary,
    },
    valueEmpty: {
      color: colors.labelTertiary,
      fontStyle: 'italic',
    },
    fieldBlock: { paddingVertical: spacing.xs },
  }));

  if (layout === 'inline') {
    return (
      <View style={[styles.fieldBlock, styles.inlineRow]}>
        <Text style={[styles.label, styles.inlineLabel]}>{label}</Text>
        <Text style={[styles.value, isEmpty && styles.valueEmpty]}>{trimmed || emptyLabel}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.field, styles.fieldBlock]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, isEmpty && styles.valueEmpty]}>{trimmed || emptyLabel}</Text>
    </View>
  );
}

type ApplicationPackageFieldsProps = {
  profile: WorkerProfile;
  displayName?: string | null;
  photoUri?: string | null;
  showDefaultNote?: boolean;
};

export function ApplicationPackageFields({
  profile,
  displayName,
  photoUri,
  showDefaultNote = true,
}: ApplicationPackageFieldsProps) {
  const styles = useThemedStyles(({ spacing }) => ({
    wrap: { gap: spacing.sm },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    profileFields: { flex: 1, gap: spacing.xs, minWidth: 0 },
  }));

  const software =
    profile.software_used.length > 0 ? profile.software_used.join(', ') : null;
  const specialties =
    profile.practice_types.length > 0
      ? profile.practice_types.map(getSpecialtyLabel).join(', ')
      : null;
  const rolesLabel = formatRoleTypesLabel(getWorkerRoleTypes(profile)) || null;
  const experienceLabel =
    profile.years_of_experience != null ? `${profile.years_of_experience} years` : null;
  const educationLabel = formatWorkerEducation(profile);
  const locationLabel = formatWorkerAddress(profile);

  return (
    <View style={styles.wrap}>
      <ApplicationPreviewGroup title="Profile">
        <View style={styles.profileRow}>
          <WorkerProfileAvatar displayName={displayName} photoUri={photoUri} size={48} />
          <View style={styles.profileFields}>
            <ApplicationPreviewField
              label="Name"
              value={displayName}
              emptyLabel="Add your name in account settings"
            />
            <ApplicationPreviewField
              label="Location"
              value={locationLabel}
              emptyLabel="Add your location in professional background"
            />
          </View>
        </View>
        <ApplicationPreviewField
          label="Roles"
          value={rolesLabel}
          emptyLabel="Add your roles in professional background"
        />
      </ApplicationPreviewGroup>

      <ApplicationPreviewGroup title="Experience">
        <ApplicationPreviewField
          label="Years"
          value={experienceLabel}
          emptyLabel="Add experience in professional background"
        />
        <ApplicationPreviewField
          label="Education"
          value={educationLabel}
          emptyLabel="Add education in professional background"
        />
        <ApplicationPreviewField
          label="Software"
          value={software}
          emptyLabel="Add software in professional background"
        />
        <ApplicationPreviewField
          label="Practice types"
          value={specialties}
          emptyLabel="Add practice types in professional background"
        />
      </ApplicationPreviewGroup>

      {showDefaultNote ? (
        <ApplicationPreviewGroup title="Notes & documents">
          <ApplicationPreviewField
            label="Default note"
            value={profile.default_cover_message}
            emptyLabel="No default note saved yet"
          />
          <ApplicationPreviewField
            label="Resume"
            value={profile.resume_storage_path ? profile.resume_file_name ?? 'PDF attached' : null}
            emptyLabel="No resume attached"
          />
        </ApplicationPreviewGroup>
      ) : profile.resume_storage_path ? (
        <ApplicationPreviewGroup title="Documents">
          <ApplicationPreviewField
            label="Resume"
            value={profile.resume_file_name ?? 'PDF attached'}
          />
        </ApplicationPreviewGroup>
      ) : null}
    </View>
  );
}
