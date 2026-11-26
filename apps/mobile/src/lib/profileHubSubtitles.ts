import type {
  ClinicProfile,
  ClinicProfileCompletenessLocation,
  UserRole,
  WorkerProfile,
} from '@chairside/api';
import {
  getWorkerRoleTypes,
  isClinicLocationRecordComplete,
  isClinicProfileComplete,
  isWorkerProfileComplete,
} from '@chairside/api';
import { getProvinceLabel, formatRoleTypesLabel, getSpecialtyLabel } from '@chairside/config';

import {
  getFillInSmsStatus,
  getFillInSmsSubtitlePart,
} from '@/lib/fillInAvailabilitySummary';
import { formatPhoneNumber } from '@/lib/phone';

export function getAccountTypeLabel(
  role: UserRole,
  options?: { isGroup?: boolean },
): string {
  if (role === 'worker') return 'Worker';
  return options?.isGroup ? 'Clinic group' : 'Clinic';
}

export function getProfessionalBackgroundSubtitle(profile: WorkerProfile | null): string {
  if (!profile) {
    return 'Add your role and city';
  }

  if (!isWorkerProfileComplete(profile)) {
    const hasRoles = getWorkerRoleTypes(profile).length > 0;
    const hasPlace = Boolean(profile.city?.trim() && profile.province?.trim());

    if (!hasRoles && !hasPlace) return 'Add role and city for fill-in texts';
    if (!hasRoles) return 'Add your role';
    if (!hasPlace) return 'Add your city';
    return 'Add your mobile number';
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
    return 'Resume and note for clinics';
  }

  if (hasResume && hasPhoto && hasNote) {
    return 'Resume, photo, and note ready';
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
        : 'Add resume and note';

  return added.length > 0 ? `${added[0]} · ${missingLabel}` : missingLabel;
}

/** Short On / Off / Add phone — account menu trailing status. */
export function getTextAlertsStatusLabel(profile: WorkerProfile | null): string {
  const { fillInsOn, smsActive, smsNeedsPhone } = getFillInSmsStatus(profile);
  if (!fillInsOn) return 'Off';
  if (smsActive) return 'On';
  if (smsNeedsPhone) return 'Add phone';
  return 'Off';
}

/** Tone for account-menu Text alerts detail color. */
export type TextAlertsStatusTone = 'on' | 'off' | 'needs_phone';

export function getTextAlertsStatusTone(profile: WorkerProfile | null): TextAlertsStatusTone {
  const { fillInsOn, smsActive, smsNeedsPhone } = getFillInSmsStatus(profile);
  if (smsActive) return 'on';
  if (fillInsOn && smsNeedsPhone) return 'needs_phone';
  return 'off';
}

/** Hub row for SMS-first text alerts (includes phone when on). */
export function getTextAlertsSubtitle(profile: WorkerProfile | null): string {
  const { fillInsOn, smsActive, smsNeedsPhone } = getFillInSmsStatus(profile);
  if (!fillInsOn) return 'Off';
  if (smsActive) {
    const phone = profile?.phone?.trim();
    return phone ? `On · ${formatPhoneNumber(phone)}` : 'On';
  }
  if (smsNeedsPhone) return 'Add phone';
  return 'Off';
}

/** Push / in-app prefs — SMS lives on Text alerts. */
export function getOtherAlertsSubtitle(): string {
  return 'Push · fill-ins and roles';
}

/** @deprecated Prefer getOtherAlertsSubtitle for the settings hub. */
export function getNotificationsSubtitle(profile: WorkerProfile | null): string {
  const fillInsOn = profile?.short_notice_available ?? false;
  const jobsOn = profile?.job_notification_opt_in ?? true;
  const parts = [`Jobs: ${jobsOn ? 'On' : 'Off'}`, `Fill-ins: ${fillInsOn ? 'On' : 'Off'}`];
  const textsPart = getFillInSmsSubtitlePart(profile);
  if (textsPart) parts.push(textsPart);
  return parts.join(' · ');
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

export function getClinicGroupDetailsSubtitle(profile: ClinicProfile | null): string {
  const name = profile?.clinic_name?.trim();
  const phone = profile?.phone?.trim();
  if (name && phone) return `${name} · ${formatPhoneNumber(phone)}`;
  if (name) return name;
  if (phone) return formatPhoneNumber(phone);
  return 'Add group name and phone';
}

/** Combined group identity + about subtitle for the Group profile settings row. */
export function getClinicGroupProfileSubtitle(
  profile: ClinicProfile | null,
  options?: { doctorCount?: number },
): string {
  const name = profile?.clinic_name?.trim();
  const hasDescription = Boolean(profile?.description?.trim());
  const hasWebsite = Boolean(profile?.website?.trim());
  const doctorCount = options?.doctorCount ?? profile?.practice_doctors?.length ?? 0;

  if (!name) return 'Add group name, story, and doctors';

  const extras: string[] = [];
  if (hasDescription) extras.push('description');
  if (hasWebsite) extras.push('website');
  if (doctorCount > 0) {
    extras.push(`${doctorCount} doctor${doctorCount === 1 ? '' : 's'}`);
  }

  if (extras.length === 0) return `${name} · Add story and doctors`;
  return `${name} · ${extras.join(', ')}`;
}

export function getClinicLocationsSubtitle(input: {
  locations: Array<ClinicProfileCompletenessLocation & { name?: string | null }>;
  isOwner: boolean;
  activeCount?: number;
}): string {
  const active = input.locations.filter((location) => location.is_active !== false);
  const count = input.activeCount ?? active.length;

  if (count === 0) {
    return input.isOwner ? 'Add a clinic' : 'Clinics you manage';
  }

  const incomplete = active.find((location) => !isClinicLocationRecordComplete(location));
  if (incomplete) {
    const label = incomplete.name?.trim() || 'a clinic';
    if (!incomplete.software_used?.length) return `Add software to ${label}`;
    return `Finish address for ${label}`;
  }

  if (count === 1 && input.isOwner) {
    return '1 clinic · Add another anytime';
  }

  return `${count} clinic${count === 1 ? '' : 's'}`;
}

export function getClinicAboutSubtitle(
  profile: ClinicProfile | null,
  options?: { isGroup?: boolean; doctorCount?: number },
): string {
  const hasDescription = Boolean(profile?.description?.trim());
  const hasWebsite = Boolean(profile?.website?.trim());
  const doctorCount = options?.doctorCount ?? profile?.practice_doctors?.length ?? 0;

  if (options?.isGroup && doctorCount > 0) {
    if (hasDescription && hasWebsite) {
      return `Description, website, and ${doctorCount} doctor${doctorCount === 1 ? '' : 's'}`;
    }
    return `${doctorCount} doctor${doctorCount === 1 ? '' : 's'} added`;
  }

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
