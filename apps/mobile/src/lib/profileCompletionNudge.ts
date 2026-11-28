import type { Href } from 'expo-router';

import { getClinicPostingSetupHref } from '@/lib/clinicPostingSetupRouting';
import {
  WORKER_CAPTURE_LOCATION,
  WORKER_CAPTURE_PHONE,
  WORKER_FINISH_PROFILE,
} from '@/lib/routing';

export type ProfileCompletionNudge = {
  /** Phone drives SMS (fill-in texts), so it gets its own, stronger copy. */
  focus: 'phone' | 'details';
  title: string;
  message: string;
  actionLabel: string;
  href: Href;
};

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

/**
 * Dashboard prompt for a clinic owner whose profile can't post yet.
 * `missing` is the output of getMissingClinicProfileFields.
 */
export function getClinicProfileNudge(
  missing: string[],
  options: { isGroup?: boolean } = {},
): ProfileCompletionNudge | null {
  if (missing.length === 0) return null;
  const href = getClinicPostingSetupHref(missing, options.isGroup);

  if (missing.includes('Phone')) {
    return {
      focus: 'phone',
      title: 'Add your clinic phone',
      message:
        'Cover-request texts go to this number, and you can’t post fill-ins without it.',
      actionLabel: 'Add phone',
      href,
    };
  }

  const needs: string[] = [];
  if (missing.includes('Clinic name')) needs.push('clinic name');
  if (missing.some((field) => /street|city|postal|location|address/i.test(field))) {
    needs.push('address');
  }

  return {
    focus: 'details',
    title: 'Finish your clinic profile',
    message: needs.length
      ? `Add your ${joinList(needs)} to start posting.`
      : 'Add your practice details to start posting.',
    actionLabel: 'Finish profile',
    href,
  };
}

/**
 * Dashboard prompt for a worker whose profile is incomplete.
 * `missing` is the output of getMissingWorkerProfileFields.
 */
export function getWorkerProfileNudge(missing: string[]): ProfileCompletionNudge | null {
  if (missing.length === 0) return null;

  if (missing.includes('Mobile phone')) {
    return {
      focus: 'phone',
      title: 'Add your mobile number',
      message: 'Fill-in openings are sent by text. Without a number you’ll miss them.',
      actionLabel: 'Add number',
      href: WORKER_CAPTURE_PHONE,
    };
  }

  const needs: string[] = [];
  if (missing.includes('Role type')) needs.push('role');
  if (missing.includes('City') || missing.includes('Province')) needs.push('city');

  const needsMatching = needs.length > 0;
  return {
    focus: 'details',
    title: 'Finish your profile',
    message: needsMatching
      ? `Add your ${joinList(needs)} so we can show matching openings.`
      : 'Add the rest of your details to see matching openings.',
    actionLabel: 'Finish profile',
    href: missing.includes('Province') ? WORKER_FINISH_PROFILE : WORKER_CAPTURE_LOCATION,
  };
}
