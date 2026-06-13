import { createContext, useContext, type ReactNode } from 'react';
import { View } from 'react-native';
import { usePathname, useSegments } from 'expo-router';

import { AppAtmosphere } from '@/components/navigation/AppAtmosphere';
import {
  getTabAtmosphereIntensityFromPathname,
  type TabAtmosphereIntensity,
  type TabAtmosphereRole,
} from '@/lib/tabAtmosphereRoutes';
import { useTheme } from '@/theme';

const TabAtmosphereContext = createContext<TabAtmosphereIntensity>('none');

export function useTabAtmosphere(): TabAtmosphereIntensity {
  return useContext(TabAtmosphereContext);
}

type TabAtmosphereShellProps = {
  role: TabAtmosphereRole;
  children: ReactNode;
};

/** Provides route-aware atmosphere intensity for tab screens. */
export function TabAtmosphereShell({ role, children }: TabAtmosphereShellProps) {
  const pathname = usePathname();
  const segments = useSegments();
  const { colors } = useTheme();
  let intensity = getTabAtmosphereIntensityFromPathname(pathname, role);

  if (intensity === 'none' && segments.includes('profile')) {
    intensity = 'subtle';
  }

  return (
    <TabAtmosphereContext.Provider value={intensity}>
      <View style={{ flex: 1, backgroundColor: colors.backgroundGrouped }}>
        {intensity !== 'none' ? <AppAtmosphere intensity={intensity} /> : null}
        <View style={{ flex: 1 }}>{children}</View>
      </View>
    </TabAtmosphereContext.Provider>
  );
}
