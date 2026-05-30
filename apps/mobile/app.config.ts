import type { ConfigContext, ExpoConfig } from 'expo/config';

import appJson from './app.json';

/**
 * Dynamic Expo config — enables iOS push entitlements for EAS builds.
 * `aps-environment` must match the build profile (development vs App Store).
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const profile = process.env.EAS_BUILD_PROFILE ?? 'development';
  const apsEnvironment = profile === 'production' ? 'production' : 'development';

  const base = { ...appJson.expo, ...config };

  return {
    ...base,
    ios: {
      ...base.ios,
      bundleIdentifier: base.ios?.bundleIdentifier ?? 'com.chairside.app',
      entitlements: {
        ...(typeof base.ios?.entitlements === 'object' ? base.ios.entitlements : {}),
        'aps-environment': apsEnvironment,
      },
      infoPlist: {
        ...(typeof base.ios?.infoPlist === 'object' ? base.ios.infoPlist : {}),
        UIBackgroundModes: ['remote-notification'],
      },
    },
    android: {
      ...base.android,
      package: base.android?.package ?? 'com.chairside.app',
      softwareKeyboardLayoutMode: 'resize',
    },
  };
};
