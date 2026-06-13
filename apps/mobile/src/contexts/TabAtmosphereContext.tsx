import { createContext, useContext, type ReactNode } from 'react';
import { usePathname, useSegments } from 'expo-router';

import {
  getTabAtmosphereIntensityFromPathname,
  type TabAtmosphereIntensity,
  type TabAtmosphereRole,
} from '@/lib/tabAtmosphereRoutes';

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
  let intensity = getTabAtmosphereIntensityFromPathname(pathname, role);

  if (intensity === 'none' && segments.includes('profile')) {
    intensity = 'subtle';
  }

  return (
    <TabAtmosphereContext.Provider value={intensity}>{children}</TabAtmosphereContext.Provider>
  );
}
