import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { useGetStartedBrowseProgress } from '@/contexts/GetStartedBrowseProgressContext';
import type { WorkerBrowseSection } from '@/lib/getStartedChecklist';

export function useMarkGetStartedBrowseVisit(section: WorkerBrowseSection) {
  const { markVisited } = useGetStartedBrowseProgress();

  useFocusEffect(
    useCallback(() => {
      void markVisited(section);
    }, [markVisited, section]),
  );
}
