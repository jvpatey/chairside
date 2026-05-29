import type { WorkerProfile } from '@chairside/api';
import { isWorkerProfileComplete } from '@chairside/api';
import { getProvinceLabel, getRoleTypeLabel } from '@chairside/config';

export function getProfessionalBackgroundSubtitle(profile: WorkerProfile | null): string {
  if (!profile || !isWorkerProfileComplete(profile)) {
    return 'Incomplete';
  }

  const roleLabel = profile.role_type ? getRoleTypeLabel(profile.role_type) : null;
  const location = [profile.city, profile.province ? getProvinceLabel(profile.province) : null]
    .filter(Boolean)
    .join(', ');

  if (roleLabel && location) return `${roleLabel} · ${location}`;
  return roleLabel ?? location ?? 'Complete';
}

export function getApplicationKitSubtitle(profile: WorkerProfile | null): string {
  const hasResume = Boolean(profile?.resume_storage_path);
  const hasPhoto = Boolean(profile?.photo_storage_path);

  const resumePart = hasResume ? 'Resume added' : 'Resume missing';
  const photoPart = hasPhoto ? 'Photo added' : 'Photo optional';

  return `${resumePart} · ${photoPart}`;
}

export function getNotificationsSubtitle(profile: WorkerProfile | null): string {
  const fillInsOn = profile?.short_notice_available ?? false;
  const jobsOn = profile?.job_notification_opt_in ?? false;
  return `Fill-ins: ${fillInsOn ? 'On' : 'Off'} · Jobs: ${jobsOn ? 'On' : 'Off'}`;
}

export function getAccountSubtitle(email?: string | null): string {
  const trimmed = email?.trim();
  if (!trimmed) return 'No email on file';
  if (trimmed.length <= 32) return trimmed;
  return `${trimmed.slice(0, 29)}…`;
}
