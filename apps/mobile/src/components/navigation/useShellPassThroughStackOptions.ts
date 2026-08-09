import { Platform } from 'react-native';

import { useShellAtmosphere } from '@/contexts/TabAtmosphereContext';
import { useTheme } from '@/theme';

/**
 * Stack options for nested tab stacks (Discover, Settings, Messages).
 * Stay transparent under the shared shell wash. Do not use transparentModal —
 * that keeps previous stack screens mounted/visible and causes overlap on web.
 * Outer Screen Background is cleared via TabAtmosphereShell's navigation theme.
 */
export function useShellPassThroughStackOptions() {
  const { colors } = useTheme();
  const shellAtmosphere = useShellAtmosphere();
  const passThrough = Platform.OS !== 'web' || shellAtmosphere;

  return {
    headerShown: false as const,
    contentStyle: {
      backgroundColor: passThrough ? 'transparent' : colors.backgroundGrouped,
    },
  };
}
