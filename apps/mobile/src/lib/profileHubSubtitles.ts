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
import { getProvinceLabel, formatRoleTypesLabel } from '@chairside/config';

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

  const location = [profile.city, profile.province ? getProvinceLabel(profile.province) : null]
    .filter(Boolean)
    .join(', ');
  const phone = profile.phone?.trim() ? formatPhoneNumber(profile.phone) : null;

  if (location && phone) return `${location} · ${phone}`;
  return location || phone || 'Complete';
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
    return `Finish address for ${label}`;
  }

  if (count === 1 && input.isOwner) {
    return '1 clinic · Add another anytime';
  }

  return `${count} clinic${count === 1 ? '' : 's'}`;
}

export function getClinicNotificationsSubtitle(options?: {
  isGroupOwner?: boolean;
}): string {
  if (options?.isGroupOwner) {
    return 'Mute alerts when managers handle day-to-day';
  }
  return 'Manage push alerts';
}

export function getSupportSubtitle(): string {
  return 'Help topics and contact form';
}
