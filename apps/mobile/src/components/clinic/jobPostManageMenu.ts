import type { JobPost } from '@chairside/api';

import { invokeJobPostManageMenu } from '@/components/clinic/JobPostManageMenuHost';

export type ShowJobPostManageMenuParams = {
  clinicId: string;
  job: JobPost;
  onUpdated: (job: JobPost) => void;
  onDeleted: () => void;
};

export function showJobPostManageMenu(params: ShowJobPostManageMenuParams) {
  invokeJobPostManageMenu(params);
}
