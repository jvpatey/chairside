import { ReactNode, useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ChipScrollFadeOverlay } from '@/components/clinic/ChipScrollFadeOverlay';
import { computeScrollFadeState } from '@/lib/chipScrollFade';
import { useThemedStyles } from '@/theme';

type ChipScrollTrackProps = {
  children: ReactNode;
  disabled?: boolean;
  fadeColor: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function ChipScrollTrack({
  children,
  disabled = false,
  fadeColor,
  contentContainerStyle,
}: ChipScrollTrackProps) {
  const [scrollX, setScrollX] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);

  const fade = computeScrollFadeState(scrollX, containerWidth, contentWidth);

  const styles = useThemedStyles(({ spacing }) => ({
    track: {
      position: 'relative' as const,
    },
    horizontalContent: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
      paddingRight: spacing.xs,
    },
    disabled: {
      opacity: 0.42,
    },
  }));

  const handleScroll = useCallback(
    (event: { nativeEvent: { contentOffset: { x: number } } }) => {
      setScrollX(event.nativeEvent.contentOffset.x);
    },
    [],
  );

  return (
    <View
      style={styles.track}
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
    >
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.horizontalContent, contentContainerStyle, disabled && styles.disabled]}
        scrollEnabled={!disabled}
        onScroll={handleScroll}
        onContentSizeChange={(width) => setContentWidth(width)}
      >
        {children}
      </ScrollView>
      <ChipScrollFadeOverlay
        canScrollLeft={fade.canScrollLeft}
        canScrollRight={fade.canScrollRight}
        fadeColor={fadeColor}
      />
    </View>
  );
}
