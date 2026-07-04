import { Platform, type ViewStyle } from 'react-native';

import { webOnlyStyle } from '@/lib/webPressableStyles';

/** Refined overlay scrollbars for web panes and pages. */
export function webScrollbarStyles(): ViewStyle {
  if (Platform.OS !== 'web') return {};

  return webOnlyStyle({
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(120, 120, 128, 0.35) transparent',
  } as ViewStyle);
}

/** Hide scrollbar while keeping scroll functionality. */
export function webHiddenScrollbarStyles(): ViewStyle {
  if (Platform.OS !== 'web') return {};

  return webOnlyStyle({
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  } as ViewStyle);
}
