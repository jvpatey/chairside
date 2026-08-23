import type { Href } from 'expo-router';

import {
  CLINIC_PROFILE_GROUP,
  CLINIC_PROFILE_LOCATIONS,
  CLINIC_PROFILE_MEMBER,
  CLINIC_SETUP_BASICS,
} from '@/lib/routing';

export function getClinicPostingSetupHref(missing: string[], isGroup: boolean): Href {
  if (!isGroup) {
    return CLINIC_SETUP_BASICS;
  }

  if (missing.some((field) => field.includes('location'))) {
    return CLINIC_PROFILE_LOCATIONS;
  }
  if (missing.includes('Clinic name')) {
    return CLINIC_PROFILE_GROUP;
  }
  if (missing.includes('Phone or contact name')) {
    return CLINIC_PROFILE_MEMBER;
  }
  return CLINIC_PROFILE_LOCATIONS;
}
