import { createContext, useContext, type ReactNode } from 'react';
import { usePathname } from 'expo-router';
import { View } from 'react-native';

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

/** Fixed brand wash behind main tab surfaces; hidden on stack/detail routes. */
export function TabAtmosphereShell({ role, children }: TabAtmosphereShellProps) {
  const pathname = usePathname();
  const { colors } = useTheme();
  const intensity = getTabAtmosphereIntensityFromPathname(pathname, role);

  return (
    <TabAtmosphereContext.Provider value={intensity}>
      <View style={{ flex: 1, backgroundColor: colors.backgroundGrouped }}>
        {intensity !== 'none' ? <AppAtmosphere intensity={intensity} /> : null}
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>{children}</View>
      </View>
    </TabAtmosphereContext.Provider>
  );
}
