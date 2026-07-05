export type HiringCelebrationAudience = 'clinic' | 'worker';
export type HiringCelebrationPostType = 'job' | 'shift';

export type HiringCelebrationPayload = {
  applicationId: string;
  postType: HiringCelebrationPostType;
  audience: HiringCelebrationAudience;
  counterpartName: string;
  postTitle: string;
  shiftDateLabel?: string | null;
  applicationUpdatedAt?: string;
};

export function getHiringCelebrationCopy(payload: HiringCelebrationPayload): {
  title: string;
  subtitle: string;
  icon: 'briefcase' | 'calendar';
} {
  const { postType, audience, counterpartName, postTitle, shiftDateLabel } = payload;

  if (postType === 'shift') {
    if (audience === 'clinic') {
      return {
        icon: 'calendar',
        title: 'Fill-in covered!',
        subtitle: `${counterpartName} is confirmed for ${postTitle}${shiftDateLabel ? ` · ${shiftDateLabel}` : ''}.`,
      };
    }
    return {
      icon: 'calendar',
      title: "You're confirmed!",
      subtitle: `${counterpartName} · ${postTitle}${shiftDateLabel ? ` · ${shiftDateLabel}` : ''}.`,
    };
  }

  if (audience === 'clinic') {
    return {
      icon: 'briefcase',
      title: 'Role filled!',
      subtitle: `${counterpartName} is hired for ${postTitle}.`,
    };
  }

  return {
    icon: 'briefcase',
    title: 'You got the role!',
    subtitle: `${counterpartName} · ${postTitle}.`,
  };
}
