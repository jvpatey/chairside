import type { WorkerProfile } from '@chairside/api';
import { getWorkerRoleTypes } from '@chairside/api';
import {
  formatWorkerAddress,
  formatWorkerEducation,
  formatRoleTypesLabel,
  getSpecialtyLabel,
} from '@chairside/config';
import { Text, View } from 'react-native';

import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { useThemedStyles } from '@/theme';

type ApplicationPreviewFieldProps = {
  label: string;
  value?: string | null;
  emptyLabel?: string;
};

export function ApplicationPreviewField({
  label,
  value,
  emptyLabel = 'Not set',
}: ApplicationPreviewFieldProps) {
  const trimmed = value?.trim();
  const isEmpty = !trimmed;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    field: { gap: 2 },
    label: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.3,
      textTransform: 'uppercase',
      color: colors.labelSecondary,
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
    wrap: { gap: spacing.xs },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      paddingBottom: spacing.xs,
    },
    headerFields: { flex: 1, gap: spacing.xs },
  }));

  const software =
    profile.software_used.length > 0 ? profile.software_used.join(', ') : null;
  const specialties =
    profile.practice_types.length > 0
      ? profile.practice_types.map(getSpecialtyLabel).join(', ')
      : null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <WorkerProfileAvatar displayName={displayName} photoUri={photoUri} size={48} />
        <View style={styles.headerFields}>
          <ApplicationPreviewField label="Name" value={displayName} />
          <ApplicationPreviewField label="Location" value={formatWorkerAddress(profile)} />
        </View>
      </View>

      <ApplicationPreviewField
        label="Roles"
        value={formatRoleTypesLabel(getWorkerRoleTypes(profile)) || null}
      />
      <ApplicationPreviewField
        label="Experience"
        value={
          profile.years_of_experience != null
            ? `${profile.years_of_experience} years`
            : null
        }
      />
      <ApplicationPreviewField label="Education" value={formatWorkerEducation(profile)} />
      <ApplicationPreviewField label="Software" value={software} />
      <ApplicationPreviewField label="Practice types" value={specialties} />
      {showDefaultNote ? (
        <ApplicationPreviewField label="Default note" value={profile.default_cover_message} />
      ) : null}
      {profile.resume_storage_path ? (
        <ApplicationPreviewField
          label="Resume"
          value={profile.resume_file_name ?? 'PDF attached'}
        />
      ) : null}
    </View>
  );
}
