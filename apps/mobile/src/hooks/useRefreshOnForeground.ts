import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

export function useRefreshOnForeground(refresh: () => void | Promise<void>) {
  useEffect(() => {
    let currentState = AppState.currentState;

    const handleChange = (nextState: AppStateStatus) => {
      if (currentState.match(/inactive|background/) && nextState === 'active') {
        void refresh();
      }
      currentState = nextState;
    };

    const subscription = AppState.addEventListener('change', handleChange);
    return () => subscription.remove();
  }, [refresh]);
}
