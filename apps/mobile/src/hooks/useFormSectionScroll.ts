import { useCallback, useRef } from 'react';
import { View } from 'react-native';

import { useFormScroll } from '@/components/onboarding/OnboardingShell';

/** Register section refs and scroll the first invalid section into view. */
export function useFormSectionScroll() {
  const { scrollWrapIntoView } = useFormScroll();
  const sectionRefs = useRef(new Map<string, View | null>());

  const setSectionRef = useCallback(
    (key: string) => (node: View | null) => {
      sectionRefs.current.set(key, node);
    },
    [],
  );

  const scrollToSection = useCallback(
    (key: string) => {
      scrollWrapIntoView(sectionRefs.current.get(key) ?? null);
    },
    [scrollWrapIntoView],
  );

  const scrollToFirstSection = useCallback(
    (keys: string[]) => {
      for (const key of keys) {
        if (sectionRefs.current.has(key)) {
          scrollToSection(key);
          return key;
        }
      }
      return null;
    },
    [scrollToSection],
  );

  return { setSectionRef, scrollToSection, scrollToFirstSection };
}
