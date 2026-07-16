import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { CONTENT_MAX_WIDTH } from '@/lib/breakpoints';
import { useThemedStyles } from '@/theme';

type WebMarketingSectionProps = {
  children: ReactNode;
  /** Full-bleed shell — backgrounds, borders, and vertical padding belong here. */
  style?: StyleProp<ViewStyle>;
  /** Width-capped inner row (defaults include horizontal padding). */
  contentStyle?: StyleProp<ViewStyle>;
  maxWidth?: number;
  /** Optional full-bleed layer behind content (gradients, atmosphere). */
  atmosphere?: ReactNode;
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
}: WebMarketingSectionProps) {
  const styles = useThemedStyles(({ spacing }) => ({
    bleed: {
      width: '100%' as const,
      alignSelf: 'stretch' as const,
      position: 'relative' as const,
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
    <View style={[styles.bleed, style]}>
      {atmosphere}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}
