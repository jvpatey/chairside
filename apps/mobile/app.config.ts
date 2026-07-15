import type { ConfigContext, ExpoConfig } from 'expo/config';

import appJson from './app.json';

/**
 * Dynamic Expo config — enables iOS push entitlements for EAS builds.
 * Only the local dev-client profile uses sandbox APNs. TestFlight and App Store
 * builds (preview + production) must use production APNs regardless of distribution.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const profile = process.env.EAS_BUILD_PROFILE ?? 'development';
  const apsEnvironment = profile === 'development' ? 'development' : 'production';

  const base = { ...appJson.expo, ...config };

  return {
    ...base,
    ios: {
      ...base.ios,
      bundleIdentifier: base.ios?.bundleIdentifier ?? 'com.chairside.app',
      associatedDomains: ['applinks:chairside.app'],
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
      intentFilters: [
        ...(Array.isArray(base.android?.intentFilters) ? base.android.intentFilters : []),
        {
          action: 'VIEW',
          autoVerify: true,
          category: ['BROWSABLE', 'DEFAULT'],
          data: [
            {
              scheme: 'https',
              host: 'chairside.app',
              pathPrefix: '/accept-invite',
            },
          ],
        },
      ],
    },
  };
};
