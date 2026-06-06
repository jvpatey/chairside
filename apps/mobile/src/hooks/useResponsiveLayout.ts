import { useWindowDimensions } from 'react-native';

import {
  getContentMaxWidth,
  getWidthTier,
  isTabletWidth,
  isWideWidth,
  type WidthTier,
} from '@/lib/breakpoints';

export type ResponsiveLayout = {
  width: number;
  height: number;
  tier: WidthTier;
  isCompact: boolean;
  isRegular: boolean;
  isWide: boolean;
  isTablet: boolean;
  contentMaxWidth: number | undefined;
  /** Suggested column count for card grids */
  gridColumns: 1 | 2;
};

export function useResponsiveLayout(): ResponsiveLayout {
  const { width, height } = useWindowDimensions();
  const tier = getWidthTier(width);

  return {
    width,
    height,
    tier,
    isCompact: tier === 'compact',
    isRegular: tier === 'regular',
    isWide: tier === 'wide',
    isTablet: isTabletWidth(width),
    contentMaxWidth: getContentMaxWidth(width),
    gridColumns: isWideWidth(width) ? 2 : 1,
  };
}
