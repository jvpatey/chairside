import type { ClinicProfile, WorkerProfile } from '@chairside/api';
import { getWorkerRoleTypes, isClinicProfileComplete, isWorkerProfileComplete } from '@chairside/api';
import { getProvinceLabel, formatRoleTypesLabel, getSpecialtyLabel } from '@chairside/config';

export function getProfessionalBackgroundSubtitle(profile: WorkerProfile | null): string {
  if (!profile || !isWorkerProfileComplete(profile)) {
    return 'Incomplete';
  }

  const roleLabel = formatRoleTypesLabel(getWorkerRoleTypes(profile)) || null;
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
  return `Jobs: ${jobsOn ? 'On' : 'Off'} · Fill-ins: ${fillInsOn ? 'On' : 'Off'}`;
}

export function getAccountSubtitle(email?: string | null): string {
  const trimmed = email?.trim();
  if (!trimmed) return 'No email on file';
  if (trimmed.length <= 32) return trimmed;
  return `${trimmed.slice(0, 29)}…`;
}

export function getClinicPracticeSubtitle(profile: ClinicProfile | null): string {
  if (!profile || !isClinicProfileComplete(profile)) {
    return 'Incomplete';
  }

  const specialty = profile.specialty ? getSpecialtyLabel(profile.specialty) : null;
  const location = [profile.city, profile.province ? getProvinceLabel(profile.province) : null]
    .filter(Boolean)
    .join(', ');

  if (specialty && location) return `${specialty} · ${location}`;
  return specialty ?? location ?? 'Complete';
}

export function getClinicAboutSubtitle(profile: ClinicProfile | null): string {
  const hasDescription = Boolean(profile?.description?.trim());
  const hasWebsite = Boolean(profile?.website?.trim());

  if (hasDescription && hasWebsite) return 'Description and website added';
  if (hasDescription) return 'Description added';
  if (hasWebsite) return 'Website added';
  return 'Add description and website';
}

export function getClinicMessagingSubtitle(profile: ClinicProfile | null): string {
  return profile?.accepts_general_candidate_messages
    ? 'General candidate messages on'
    : 'General candidate messages off';
}

export function getClinicNotificationsSubtitle(): string {
  return 'Manage push alerts';
}
