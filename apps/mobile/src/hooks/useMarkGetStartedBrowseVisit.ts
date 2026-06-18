import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { markGetStartedBrowseVisited } from '@/hooks/useGetStartedBrowseProgress';
import type { WorkerBrowseSection } from '@/lib/getStartedChecklist';

export function useMarkGetStartedBrowseVisit(section: WorkerBrowseSection) {
  useFocusEffect(
    useCallback(() => {
      void markGetStartedBrowseVisited(section);
    }, [section]),
  );
}
