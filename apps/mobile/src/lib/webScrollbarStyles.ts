import { Platform, type ViewStyle } from 'react-native';

import { webOnlyStyle } from '@/lib/webPressableStyles';

/** Subtle overlay scrollbars for web split-view panes. */
export function webScrollbarStyles(): ViewStyle {
  if (Platform.OS !== 'web') return {};

  return webOnlyStyle({
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(120, 120, 128, 0.35) transparent',
  } as ViewStyle);
}
