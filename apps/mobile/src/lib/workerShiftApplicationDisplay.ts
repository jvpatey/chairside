import type { WorkerApplication } from '@chairside/api';

import { formatShiftPostMeta, formatShiftPostRoleTitle } from '@/lib/shiftPostDisplay';

export function getWorkerShiftApplicationCardDisplay(application: WorkerApplication): {
  title: string;
  location: string | null;
  shiftSchedule: string | null;
} {
  const roleType = application.post_role_type ?? application.role_type ?? 'other';
  const title = formatShiftPostRoleTitle(roleType);

  const location =
    application.clinic_location ??
    ([application.clinic_address, application.clinic_city, application.clinic_province]
      .filter(Boolean)
      .join(' · ') || null);

  const shiftSchedule =
    application.shift_date != null
      ? formatShiftPostMeta({
          shift_date: application.shift_date,
          start_time: application.shift_start_time ?? null,
          end_time: application.shift_end_time ?? null,
        })
      : application.post_title.replace(/^Fill-in · /, '');

  return { title, location, shiftSchedule };
}
