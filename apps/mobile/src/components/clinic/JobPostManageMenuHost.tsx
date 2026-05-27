import { useEffect, useState } from 'react';

import { JobPostManageSheet } from '@/components/clinic/JobPostManageSheet';
import type { ShowJobPostManageMenuParams } from '@/components/clinic/jobPostManageMenu';

type OpenMenu = (params: ShowJobPostManageMenuParams) => void;

let openJobPostManageMenu: OpenMenu | null = null;

export function registerJobPostManageMenuOpener(opener: OpenMenu | null) {
  openJobPostManageMenu = opener;
}

export function JobPostManageMenuHost() {
  const [params, setParams] = useState<ShowJobPostManageMenuParams | null>(null);

  useEffect(() => {
    registerJobPostManageMenuOpener(setParams);
    return () => registerJobPostManageMenuOpener(null);
  }, []);

  if (!params) {
    return null;
  }

  return (
    <JobPostManageSheet
      visible
      clinicId={params.clinicId}
      job={params.job}
      onUpdated={(job) => {
        params.onUpdated(job);
        setParams(null);
      }}
      onDeleted={() => {
        params.onDeleted();
        setParams(null);
      }}
      onClose={() => setParams(null)}
    />
  );
}

export function invokeJobPostManageMenu(params: ShowJobPostManageMenuParams) {
  openJobPostManageMenu?.(params);
}
