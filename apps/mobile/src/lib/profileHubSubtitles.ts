import type { ClinicProfile, UserRole, WorkerProfile } from '@chairside/api';
import { getWorkerRoleTypes, isClinicProfileComplete, isWorkerProfileComplete } from '@chairside/api';
import { getProvinceLabel, formatRoleTypesLabel, getSpecialtyLabel } from '@chairside/config';

export function getAccountTypeLabel(role: UserRole): string {
  return role === 'worker' ? 'Find work' : 'Clinic';
}

export function getProfessionalBackgroundSubtitle(profile: WorkerProfile | null): string {
  if (!profile) {
    return 'Add roles, experience, and location';
  }

  if (!isWorkerProfileComplete(profile)) {
    const hasRoles = getWorkerRoleTypes(profile).length > 0;
    const hasLocation = Boolean(
      profile.address_line1?.trim() && profile.city?.trim() && profile.postal_code?.trim(),
    );

    if (!hasRoles && !hasLocation) return 'Add roles and location to complete';
    if (!hasRoles) return 'Add your roles to complete';
    if (!hasLocation) return 'Add your location to complete';
    return 'Finish required details';
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
  const hasNote = Boolean(profile?.default_cover_message?.trim());

  if (!hasResume && !hasPhoto && !hasNote) {
    return 'Add a resume, photo, and note for clinics';
  }

  if (hasResume && hasPhoto && hasNote) {
    return 'Resume, photo, and note clinics see when you apply';
  }

  const added: string[] = [];
  const missing: string[] = [];
  if (hasResume) added.push('Resume added');
  else missing.push('resume');
  if (hasPhoto) added.push('Photo added');
  else missing.push('photo');
  if (hasNote) added.push('Note added');
  else missing.push('note');

  const missingLabel =
    missing.length === 1
      ? `Add a ${missing[0]}`
      : missing.length === 2
        ? `Add ${missing[0]} and ${missing[1]}`
        : 'Add a resume, photo, and note';

  return added.length > 0 ? `${added[0]} · ${missingLabel}` : missingLabel;
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

export function getClinicMemberProfileSubtitle(input: {
  displayName?: string | null;
  title?: string | null;
  hasPhoto?: boolean;
  hasBio?: boolean;
}): string {
  const name = input.displayName?.trim();
  const title = input.title?.trim();
  if (!name) return 'Add your name, photo, and bio';
  const extras: string[] = [];
  if (input.hasPhoto) extras.push('photo');
  if (input.hasBio) extras.push('bio');
  if (title && extras.length > 0) return `${title} · ${extras.join(' + ')}`;
  if (title) return title;
  if (extras.length > 0) return extras.map((item) => item[0]!.toUpperCase() + item.slice(1)).join(' + ');
  return 'Add a photo and bio';
}

export function getClinicMessagingSubtitle(profile: ClinicProfile | null): string {
  return profile?.accepts_general_candidate_messages
    ? 'Candidates can message you'
    : "Candidates can't message you";
}

export function getClinicNotificationsSubtitle(options?: {
  isGroupOwner?: boolean;
}): string {
  if (options?.isGroupOwner) {
    return 'Mute apps & messages when managers handle day-to-day';
  }
  return 'Manage push alerts';
}

export function getClinicBillingSubtitle(planLabel?: string | null): string {
  return planLabel ? `${planLabel} plan` : 'Free plan';
}

export function getSupportSubtitle(): string {
  return 'Help topics and contact form';
}
