import type { JobPost } from '@chairside/api';
import type { StyleProp, ViewStyle } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { showJobPostManageMenu } from '@/components/clinic/jobPostManageMenu';

type JobPostManageMenuProps = {
  clinicId: string;
  job: JobPost;
  onUpdated: (job: JobPost) => void;
  onDeleted: () => void;
  style?: StyleProp<ViewStyle>;
};

export function JobPostManageMenu({
  clinicId,
  job,
  onUpdated,
  onDeleted,
  style,
}: JobPostManageMenuProps) {
  return (
    <OnboardingButton
      label="Manage"
      variant="secondary"
      onPress={() => showJobPostManageMenu({ clinicId, job, onUpdated, onDeleted })}
      style={style}
    />
  );
}
