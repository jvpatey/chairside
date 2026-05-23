import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export function useRefreshOnFocus(refresh: () => void | Promise<void>) {
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );
}
