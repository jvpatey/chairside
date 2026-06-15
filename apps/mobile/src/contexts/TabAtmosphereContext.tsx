import { createContext, useContext, type ReactNode } from 'react';
import { View } from 'react-native';
import { usePathname, useSegments } from 'expo-router';

import { AppAtmosphere } from '@/components/navigation/AppAtmosphere';
import {
  getTabAtmosphereAccentFromPathname,
  getTabAtmosphereIntensityFromPathname,
  type TabAtmosphereAccent,
  type TabAtmosphereIntensity,
  type TabAtmosphereRole,
} from '@/lib/tabAtmosphereRoutes';
import { useTheme } from '@/theme';

type TabAtmosphereState = {
  intensity: TabAtmosphereIntensity;
  accent: TabAtmosphereAccent;
};

const defaultTabAtmosphere: TabAtmosphereState = {
  intensity: 'none',
  accent: 'primary',
};

const TabAtmosphereContext = createContext<TabAtmosphereState>(defaultTabAtmosphere);

export function useTabAtmosphere(): TabAtmosphereIntensity {
  return useContext(TabAtmosphereContext).intensity;
}

export function useTabAtmosphereAccent(): TabAtmosphereAccent {
  return useContext(TabAtmosphereContext).accent;
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
  const accent = getTabAtmosphereAccentFromPathname(pathname, role);

  if (intensity === 'none' && segments.includes('profile')) {
    intensity = 'subtle';
  }

  return (
    <TabAtmosphereContext.Provider value={{ intensity, accent }}>
      <View style={{ flex: 1, backgroundColor: colors.backgroundGrouped }}>
        {intensity !== 'none' ? <AppAtmosphere intensity={intensity} accent={accent} /> : null}
        <View style={{ flex: 1 }}>{children}</View>
      </View>
    </TabAtmosphereContext.Provider>
  );
}
