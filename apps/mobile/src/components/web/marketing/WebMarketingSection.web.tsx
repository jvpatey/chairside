import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { CONTENT_MAX_WIDTH } from '@/lib/breakpoints';
import { webOnlyStyle } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

/** Offset sticky marketing nav when scrolling to section anchors. */
const SECTION_SCROLL_MARGIN = 88;

type WebMarketingSectionProps = {
  children: ReactNode;
  /** Full-bleed shell — backgrounds, borders, and vertical padding belong here. */
  style?: StyleProp<ViewStyle>;
  /** Width-capped inner row (defaults include horizontal padding). */
  contentStyle?: StyleProp<ViewStyle>;
  maxWidth?: number;
  /** Optional full-bleed layer behind content (gradients, atmosphere). */
  atmosphere?: ReactNode;
  /** Anchor id for in-page nav (maps to nativeID on web). */
  sectionId?: string;
};

/**
 * Marketing section shell: backgrounds/borders span the viewport;
 * content stays centered at CONTENT_MAX_WIDTH.
 */
export function WebMarketingSection({
  children,
  style,
  contentStyle,
  maxWidth = CONTENT_MAX_WIDTH.xwide,
  atmosphere,
  sectionId,
}: WebMarketingSectionProps) {
  const styles = useThemedStyles(({ spacing }) => ({
    bleed: {
      width: '100%' as const,
      alignSelf: 'stretch' as const,
      position: 'relative' as const,
      ...(sectionId
        ? webOnlyStyle({ scrollMarginTop: SECTION_SCROLL_MARGIN } as object)
        : {}),
    },
    content: {
      width: '100%' as const,
      maxWidth,
      alignSelf: 'center' as const,
      paddingHorizontal: spacing.lg,
      position: 'relative' as const,
      zIndex: 1,
    },
  }));

  return (
    <View nativeID={sectionId} style={[styles.bleed, style]}>
      {atmosphere}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}
