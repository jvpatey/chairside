import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  View,
  type NativeSyntheticEvent,
  type ScrollView as ScrollViewType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ChipScrollFadeOverlay } from '@/components/clinic/ChipScrollFadeOverlay';
import { computeScrollFadeState } from '@/lib/chipScrollFade';
import { webOnlyStyle } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

type ChipScrollTrackProps = {
  children: ReactNode;
  disabled?: boolean;
  fadeColor: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

const DRAG_THRESHOLD_PX = 4;

type DragState = {
  active: boolean;
  didDrag: boolean;
  startX: number;
  startScrollLeft: number;
};

export function ChipScrollTrack({
  children,
  disabled = false,
  fadeColor,
  contentContainerStyle,
}: ChipScrollTrackProps) {
  const scrollRef = useRef<ScrollViewType>(null);
  const dragStateRef = useRef<DragState>({
    active: false,
    didDrag: false,
    startX: 0,
    startScrollLeft: 0,
  });

  const [scrollX, setScrollX] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);

  const fade = computeScrollFadeState(scrollX, containerWidth, contentWidth);

  const styles = useThemedStyles(({ spacing }) => ({
    track: {
      position: 'relative' as const,
    },
    scroll: {
      ...(disabled
        ? {}
        : webOnlyStyle({
            cursor: 'grab',
            userSelect: 'none',
          } as ViewStyle)),
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

  const getScrollNode = useCallback((): HTMLElement | null => {
    const instance = scrollRef.current as ScrollViewType & {
      getScrollableNode?: () => HTMLElement;
    } | null;
    return instance?.getScrollableNode?.() ?? null;
  }, []);

  const onMouseMoveRef = useRef<(event: MouseEvent) => void>(() => {});
  const onMouseUpRef = useRef<() => void>(() => {});

  onMouseMoveRef.current = (event: MouseEvent) => {
    const node = getScrollNode();
    if (!node || !dragStateRef.current.active || disabled) return;

    const deltaX = event.clientX - dragStateRef.current.startX;
    if (!dragStateRef.current.didDrag && Math.abs(deltaX) < DRAG_THRESHOLD_PX) return;

    dragStateRef.current.didDrag = true;
    node.style.cursor = 'grabbing';
    event.preventDefault();
    node.scrollLeft = dragStateRef.current.startScrollLeft - deltaX;
  };

  onMouseUpRef.current = () => {
    const node = getScrollNode();
    const { didDrag } = dragStateRef.current;

    window.removeEventListener('mousemove', onMouseMoveRef.current);
    window.removeEventListener('mouseup', onMouseUpRef.current);

    dragStateRef.current.active = false;

    if (node && !disabled) {
      node.style.cursor = 'grab';
    }

    if (node && didDrag) {
      const suppressClick = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        node.removeEventListener('click', suppressClick, true);
      };
      node.addEventListener('click', suppressClick, true);
    }

    dragStateRef.current.didDrag = false;
  };

  const handleMouseDown = useCallback(
    (event: NativeSyntheticEvent<{ clientX?: number }>) => {
      if (disabled) return;
      const node = getScrollNode();
      if (!node) return;

      dragStateRef.current = {
        active: true,
        didDrag: false,
        startX: event.nativeEvent.clientX ?? 0,
        startScrollLeft: node.scrollLeft,
      };

      window.addEventListener('mousemove', onMouseMoveRef.current);
      window.addEventListener('mouseup', onMouseUpRef.current);
    },
    [disabled, getScrollNode],
  );

  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', onMouseMoveRef.current);
      window.removeEventListener('mouseup', onMouseUpRef.current);
    };
  }, []);

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
        ref={scrollRef}
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        style={styles.scroll}
        contentContainerStyle={[styles.horizontalContent, contentContainerStyle, disabled && styles.disabled]}
        scrollEnabled={!disabled}
        onScroll={handleScroll}
        onContentSizeChange={(width) => setContentWidth(width)}
        onMouseDown={disabled ? undefined : handleMouseDown}
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
