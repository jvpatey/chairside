import type { ApplicationScreening, WorkerApplication } from '@chairside/api';
import {
  formatApplicationEducation,
  formatApplicationResumeStatus,
  formatRoleTypesLabel,
  resolveWorkerRoleTypes,
  getSpecialtyLabel,
} from '@chairside/config';
import { Text, View } from 'react-native';

import { ApplicationPreviewField } from '@/components/worker/ApplicationPackageFields';
import { ApplicationPreviewGroup } from '@/components/worker/ApplicationPreviewGroup';
import { ApplicationScreeningPreview } from '@/components/clinic/ApplicationScreeningSection';
import { ResumeViewButton } from '@/components/ui/ResumeViewButton';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { useWorkerPhotoUri } from '@/hooks/useWorkerPhotoUri';
import { buildResumeFileName } from '@/lib/openResumePreview';
import { useThemedStyles } from '@/theme';

type ApplicationSubmittedFieldsProps = {
  application: WorkerApplication;
  screening?: ApplicationScreening | null;
};

export function ApplicationSubmittedFields({
  application,
  screening,
}: ApplicationSubmittedFieldsProps) {
  const photoUri = useWorkerPhotoUri(application.worker_photo_storage_path);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    wrap: { gap: spacing.sm },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    profileText: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    profileName: {
      fontSize: 16,
      lineHeight: 21,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    profileLocation: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    resumeAction: {
      paddingTop: spacing.xs,
    },
  }));

  const softwareLabel =
    (application.software_used ?? []).length > 0
      ? application.software_used.join(', ')
      : null;
  const specialtiesLabel =
    (application.practice_types ?? []).length > 0
      ? application.practice_types.map(getSpecialtyLabel).join(', ')
      : null;
  const experienceLabel =
    application.years_of_experience != null
      ? `${application.years_of_experience} years`
      : null;
  const rolesLabel = formatRoleTypesLabel(resolveWorkerRoleTypes(application)) || null;
  const educationLabel = formatApplicationEducation(application.education);
  const resumeFileName = buildResumeFileName({
    workerDisplayName: application.worker_display_name,
    postTitle: application.post_title,
  });

  const hasQualifications =
    rolesLabel || experienceLabel || educationLabel || softwareLabel || specialtiesLabel;

  return (
    <View style={styles.wrap}>
      <ApplicationPreviewGroup title="Profile">
        <View style={styles.profileRow}>
          <WorkerProfileAvatar
            displayName={application.worker_display_name}
            photoUri={photoUri}
            size={48}
          />
          <View style={styles.profileText}>
            <Text style={styles.profileName} numberOfLines={2}>
              {application.worker_display_name}
            </Text>
            {application.worker_address ? (
              <Text style={styles.profileLocation} numberOfLines={2}>
                {application.worker_address}
              </Text>
            ) : null}
          </View>
        </View>
      </ApplicationPreviewGroup>

      {hasQualifications ? (
        <ApplicationPreviewGroup title="Qualifications">
          {rolesLabel ? <ApplicationPreviewField label="Roles" value={rolesLabel} /> : null}
          {experienceLabel ? (
            <ApplicationPreviewField label="Experience" value={experienceLabel} />
          ) : null}
          {educationLabel ? (
            <ApplicationPreviewField label="Education" value={educationLabel} />
          ) : null}
          {softwareLabel ? <ApplicationPreviewField label="Software" value={softwareLabel} /> : null}
          {specialtiesLabel ? (
            <ApplicationPreviewField label="Specialties" value={specialtiesLabel} />
          ) : null}
        </ApplicationPreviewGroup>
      ) : null}

      <ApplicationPreviewGroup title="Documents">
        <ApplicationPreviewField
          label="Resume"
          value={formatApplicationResumeStatus(application.resume_storage_path)}
        />
        {application.resume_storage_path ? (
          <View style={styles.resumeAction}>
            <ResumeViewButton
              storagePath={application.resume_storage_path}
              fileName={resumeFileName}
            />
          </View>
        ) : null}
      </ApplicationPreviewGroup>

      {screening ? (
        <ApplicationScreeningPreview screening={screening} audience="worker" defaultExpanded={false} />
      ) : null}
    </View>
  );
}
