import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';

export function usePullToRefresh(refreshFn: () => void | Promise<void>) {
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setRefreshing(false);
      };
    }, []),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshFn();
    } finally {
      setRefreshing(false);
    }
  }, [refreshFn]);

  return { refreshing, onRefresh };
}
