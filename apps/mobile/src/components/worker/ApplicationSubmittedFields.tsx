import type { WorkerApplication } from '@chairside/api';
import {
  formatApplicationEducation,
  formatApplicationResumeStatus,
  getRoleTypeLabel,
  getSpecialtyLabel,
} from '@chairside/config';
import { View } from 'react-native';

import { ApplicationPreviewField } from '@/components/worker/ApplicationPackageFields';
import { ResumeViewButton } from '@/components/ui/ResumeViewButton';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { useWorkerPhotoUri } from '@/hooks/useWorkerPhotoUri';
import { buildResumeFileName } from '@/lib/openResumePreview';
import { useThemedStyles } from '@/theme';

type ApplicationSubmittedFieldsProps = {
  application: WorkerApplication;
};

export function ApplicationSubmittedFields({ application }: ApplicationSubmittedFieldsProps) {
  const photoUri = useWorkerPhotoUri(application.worker_photo_storage_path);

  const styles = useThemedStyles(({ spacing }) => ({
    wrap: { gap: spacing.xs },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      paddingBottom: spacing.xs,
    },
    headerFields: { flex: 1, gap: spacing.xs },
    resumeAction: {
      paddingTop: spacing.sm,
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
  const resumeFileName = buildResumeFileName({
    workerDisplayName: application.worker_display_name,
    postTitle: application.post_title,
  });

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <WorkerProfileAvatar
          displayName={application.worker_display_name}
          photoUri={photoUri}
          size={48}
        />
        <View style={styles.headerFields}>
          <ApplicationPreviewField label="Name" value={application.worker_display_name} />
          <ApplicationPreviewField label="Location" value={application.worker_address} />
        </View>
      </View>

      <ApplicationPreviewField
        label="Role"
        value={application.role_type ? getRoleTypeLabel(application.role_type) : null}
      />
      <ApplicationPreviewField label="Experience" value={experienceLabel} />
      <ApplicationPreviewField
        label="Education"
        value={formatApplicationEducation(application.education)}
      />
      <ApplicationPreviewField label="Software" value={softwareLabel} />
      <ApplicationPreviewField label="Specialties" value={specialtiesLabel} />
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
    </View>
  );
}
