import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { ThemeProvider, useTheme as useNavigationTheme } from '@react-navigation/native';
import { usePathname, useSegments } from 'expo-router';

import { AppAtmosphere } from '@/components/navigation/AppAtmosphere';
import {
  getTabAtmosphereAccentFromPathname,
  getTabAtmosphereIntensityFromPathname,
  type TabAtmosphereAccent,
  type TabAtmosphereIntensity,
  type TabAtmosphereRole,
} from '@/lib/tabAtmosphereRoutes';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useTheme } from '@/theme';

type TabAtmosphereState = {
  intensity: TabAtmosphereIntensity;
  accent: TabAtmosphereAccent;
  /** Web tablet — shell paints one viewport-fixed gradient; screens skip local layers. */
  shellAtmosphere: boolean;
};

const defaultTabAtmosphere: TabAtmosphereState = {
  intensity: 'none',
  accent: 'primary',
  shellAtmosphere: false,
};

const TabAtmosphereContext = createContext<TabAtmosphereState>(defaultTabAtmosphere);

export function useTabAtmosphere(): TabAtmosphereIntensity {
  return useContext(TabAtmosphereContext).intensity;
}

export function useTabAtmosphereAccent(): TabAtmosphereAccent {
  return useContext(TabAtmosphereContext).accent;
}

/** True when the tab shell owns atmosphere painting (web tablet with active wash). */
export function useShellAtmosphere(): boolean {
  return useContext(TabAtmosphereContext).shellAtmosphere;
}

type TabAtmosphereShellProps = {
  role: TabAtmosphereRole;
  children: ReactNode;
};

/**
 * Nested navigators paint `theme.colors.background` on Screen wrappers.
 * Clear that fill under the shared wash so Discover/Settings stacks don't need
 * transparentModal (which keeps previous screens visible and causes overlap).
 */
function ShellNavigationTheme({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  const navigationTheme = useNavigationTheme();
  const shellTheme = useMemo(() => {
    if (!enabled) return navigationTheme;
    return {
      ...navigationTheme,
      colors: {
        ...navigationTheme.colors,
        background: 'transparent',
      },
    };
  }, [enabled, navigationTheme]);

  // Always wrap so enabling/disabling shell atmosphere does not remount the tab navigator
  // (a remount resets to the first declared tab — Roles/postings — on web).
  return <ThemeProvider value={shellTheme}>{children}</ThemeProvider>;
}

/** Provides route-aware atmosphere intensity for tab screens. */
export function TabAtmosphereShell({ role, children }: TabAtmosphereShellProps) {
  const pathname = usePathname();
  const segments = useSegments();
  const { isTablet } = useResponsiveLayout();
  const { colors } = useTheme();
  let intensity = getTabAtmosphereIntensityFromPathname(pathname, role);
  const accent = getTabAtmosphereAccentFromPathname(pathname, role);

  if (intensity === 'none' && segments.includes('profile')) {
    intensity = 'subtle';
  }

  const shellAtmosphere = Platform.OS === 'web' && isTablet && intensity !== 'none';
  const paintAtmosphere = intensity !== 'none' && (Platform.OS !== 'web' || shellAtmosphere);

  return (
    <TabAtmosphereContext.Provider value={{ intensity, accent, shellAtmosphere }}>
      <View style={{ flex: 1, backgroundColor: colors.backgroundGrouped, position: 'relative' }}>
        {paintAtmosphere ? (
          <AppAtmosphere
            intensity={intensity}
            accent={accent}
            viewportFixed={shellAtmosphere}
          />
        ) : null}
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
          <ShellNavigationTheme enabled={shellAtmosphere}>{children}</ShellNavigationTheme>
        </View>
      </View>
    </TabAtmosphereContext.Provider>
  );
}
