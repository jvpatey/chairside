import { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  Text,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { webOnlyStyle, webPointer } from '@/lib/webPressableStyles';
import { fontWordmark } from '@/theme/fonts';
import { useTheme } from '@/theme';

type ChairsideWordmarkProps = {
  /** `stacked` = app-icon lockup (chair over side) for collapsed chrome. */
  variant?: 'hero' | 'compact' | 'small' | 'stacked';
  align?: 'left' | 'center';
  /**
   * Sidebar chrome: morphs inline → stacked with a swing when true.
   * Prefer this over swapping `small` / `stacked` variants.
   */
  collapsed?: boolean;
  /** Web-only: slides "side" right on hover. Defaults on when `onPress` is set. */
  animateSideOnHover?: boolean;
  onPress?: () => void;
};

const COMPACT = { fontSize: 28, letterSpacing: -0.6 } as const;
const SMALL = { fontSize: 20, letterSpacing: -0.45 } as const;
/** Collapsed sidebar / rail — matches iOS stacked app-icon wordmark. */
const STACKED = { fontSize: 11, letterSpacing: -0.35, lineHeight: 12, gap: 1 } as const;
const SIDE_SLIDE_PX = 10;

type ChairsideBrandTextProps = {
  /** Inherit surrounding title/body size, or use a fixed wordmark size. */
  variant?: 'inherit' | 'compact' | 'small';
};

/** Inline two-tone "chairside" for titles and sentences. */
export function ChairsideBrandText({ variant = 'inherit' }: ChairsideBrandTextProps) {
  const { colors } = useTheme();
  const sizing =
    variant === 'compact' ? COMPACT : variant === 'small' ? SMALL : null;

  const baseStyle = {
    fontFamily: fontWordmark,
    textTransform: 'lowercase' as const,
    ...(sizing
      ? { fontSize: sizing.fontSize, letterSpacing: sizing.letterSpacing }
      : { letterSpacing: COMPACT.letterSpacing }),
  };

  return (
    <Text style={baseStyle}>
      <Text style={{ color: colors.labelPrimary }}>chair</Text>
      <Text style={{ color: colors.primary }}>side</Text>
    </Text>
  );
}

function heroSize(screenWidth: number) {
  return Math.round(Math.max(52, Math.min(screenWidth * 0.14, 56)));
}

function WordmarkSplitText({
  baseTextStyle,
  colors,
  slideSide,
}: {
  baseTextStyle: {
    fontFamily: string;
    fontSize: number;
    letterSpacing: number;
    textTransform: 'lowercase';
  };
  colors: { labelPrimary: string; primary: string };
  slideSide: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
      <Text style={[baseTextStyle, { color: colors.labelPrimary }]}>chair</Text>
      <Text
        style={
          {
            ...baseTextStyle,
            color: colors.primary,
            transform: [{ translateX: slideSide ? SIDE_SLIDE_PX : 0 }],
            ...webOnlyStyle({
              transitionProperty: 'transform',
              transitionDuration: '280ms',
              transitionTimingFunction: 'ease-out',
            } as ViewStyle),
          } as TextStyle
        }>
        side
      </Text>
    </View>
  );
}

function StackedWordmark({
  colors,
  alignStyle,
  onPress,
}: {
  colors: { labelPrimary: string; primary: string };
  alignStyle: ViewStyle;
  onPress?: () => void;
}) {
  const lineStyle = {
    fontFamily: fontWordmark,
    fontSize: STACKED.fontSize,
    lineHeight: STACKED.lineHeight,
    letterSpacing: STACKED.letterSpacing,
    textTransform: 'lowercase' as const,
    textAlign: 'center' as const,
  };

  const stack = (
    <View style={{ alignItems: 'center', gap: STACKED.gap }}>
      <Text style={[lineStyle, { color: colors.labelPrimary }]}>chair</Text>
      <Text style={[lineStyle, { color: colors.primary }]}>side</Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="chairside"
        accessibilityHint="Go to home"
        onPress={onPress}
        style={[alignStyle, webPointer()]}>
        {stack}
      </Pressable>
    );
  }

  return (
    <View accessibilityRole="header" accessibilityLabel="chairside" style={alignStyle}>
      {stack}
    </View>
  );
}

const SIDEBAR_MORPH_MS = 620;
/** Softer ease — longer ease-out so the swing settles smoothly. */
const SIDEBAR_MORPH_EASE = Easing.bezier(0.22, 0.8, 0.2, 1);
const SIDEBAR_STACK_GAP = 2;
const SIDEBAR_WORDMARK_LINE = SMALL.fontSize + 4;

/**
 * Sidebar lockup: "side" swings from beside "chair" to underneath (same type size).
 * Collapsed rail is wide enough that glyphs do not shrink.
 */
function AnimatedSidebarWordmark({
  collapsed,
  onPress,
}: {
  collapsed: boolean;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(collapsed ? 1 : 0);
  const chairW = useSharedValue(52);
  const chairH = useSharedValue(22);
  const sideW = useSharedValue(40);
  const sideH = useSharedValue(22);
  const [shellAlign, setShellAlign] = useState<'flex-start' | 'center'>(
    collapsed ? 'center' : 'flex-start',
  );

  useEffect(() => {
    const target = collapsed ? 1 : 0;
    setShellAlign(collapsed ? 'center' : 'flex-start');
    if (reduceMotion) {
      progress.value = target;
      return;
    }
    progress.value = withTiming(target, {
      duration: SIDEBAR_MORPH_MS,
      easing: SIDEBAR_MORPH_EASE,
    });
  }, [collapsed, progress, reduceMotion]);

  const measureInline = (part: 'chair' | 'side') => (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width <= 0 || height <= 0) return;
    if (part === 'chair') {
      chairW.value = width;
      chairH.value = height;
    } else {
      sideW.value = width;
      sideH.value = height;
    }
  };

  const shellStyle = useAnimatedStyle(() => {
    const cW = chairW.value;
    const cH = chairH.value;
    const sW = sideW.value;
    const sH = sideH.value;
    return {
      width: interpolate(progress.value, [0, 1], [cW + sW, Math.max(cW, sW)]),
      height: interpolate(
        progress.value,
        [0, 1],
        [Math.max(cH, sH), cH + SIDEBAR_STACK_GAP + sH],
      ),
    };
  });

  const chairTextStyle = useAnimatedStyle(() => {
    const stackedShellW = Math.max(chairW.value, sideW.value);
    const stackedOffsetX = Math.max(0, (stackedShellW - chairW.value) / 2);
    return {
      fontFamily: fontWordmark,
      fontSize: SMALL.fontSize,
      letterSpacing: SMALL.letterSpacing,
      lineHeight: SIDEBAR_WORDMARK_LINE,
      textTransform: 'lowercase' as const,
      color: colors.labelPrimary,
      transform: [{ translateX: interpolate(progress.value, [0, 1], [0, stackedOffsetX]) }],
    };
  });

  const sideTextStyle = useAnimatedStyle(() => {
    const cW = chairW.value;
    const cH = chairH.value;
    const sW = sideW.value;
    const stackedShellW = Math.max(cW, sW);
    const startX = cW;
    const endX = Math.max(0, (stackedShellW - sW) / 2);
    const endY = cH + SIDEBAR_STACK_GAP;
    const angle = interpolate(progress.value, [0, 1], [0, Math.PI / 2]);
    const radius = Math.max(cH * 0.9, 16);
    const arcX = startX - radius * (1 - Math.cos(angle));
    const arcY = radius * Math.sin(angle);
    const swingX = interpolate(progress.value, [0, 0.5, 1], [startX, arcX, endX]);
    const swingY = interpolate(progress.value, [0, 0.5, 1], [0, arcY, endY]);
    const rotate = interpolate(progress.value, [0, 0.4, 0.85, 1], [0, -14, -4, 0]);
    return {
      position: 'absolute' as const,
      left: 0,
      top: 0,
      fontFamily: fontWordmark,
      fontSize: SMALL.fontSize,
      letterSpacing: SMALL.letterSpacing,
      lineHeight: SIDEBAR_WORDMARK_LINE,
      textTransform: 'lowercase' as const,
      color: colors.primary,
      transform: [{ translateX: swingX }, { translateY: swingY }, { rotate: `${rotate}deg` }],
    };
  });

  const measureStyle = {
    position: 'absolute' as const,
    opacity: 0,
    pointerEvents: 'none' as const,
    fontFamily: fontWordmark,
    fontSize: SMALL.fontSize,
    letterSpacing: SMALL.letterSpacing,
    textTransform: 'lowercase' as const,
  };

  const content = (
    <Animated.View style={[{ overflow: 'visible' as const, alignSelf: shellAlign }, shellStyle]}>
      <Text style={measureStyle} onLayout={measureInline('chair')}>
        chair
      </Text>
      <Text style={measureStyle} onLayout={measureInline('side')}>
        side
      </Text>
      <Animated.Text style={chairTextStyle} numberOfLines={1}>
        chair
      </Animated.Text>
      <Animated.Text style={sideTextStyle} numberOfLines={1}>
        side
      </Animated.Text>
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="chairside"
        accessibilityHint="Go to home"
        onPress={onPress}
        style={webPointer()}>
        {content}
      </Pressable>
    );
  }

  return (
    <View accessibilityRole="header" accessibilityLabel="chairside">
      {content}
    </View>
  );
}

export function ChairsideWordmark({
  variant = 'hero',
  align = 'center',
  collapsed,
  animateSideOnHover = false,
  onPress,
}: ChairsideWordmarkProps) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const alignStyle = { alignSelf: align === 'left' ? ('flex-start' as const) : ('center' as const) };

  if (typeof collapsed === 'boolean') {
    return <AnimatedSidebarWordmark collapsed={collapsed} onPress={onPress} />;
  }

  if (variant === 'stacked') {
    return <StackedWordmark colors={colors} alignStyle={alignStyle} onPress={onPress} />;
  }

  const fontSize =
    variant === 'hero' ? heroSize(screenWidth) : variant === 'small' ? SMALL.fontSize : COMPACT.fontSize;
  const letterSpacing =
    variant === 'hero'
      ? fontSize >= 55
        ? -1.4
        : -1.2
      : variant === 'small'
        ? SMALL.letterSpacing
        : COMPACT.letterSpacing;

  const baseTextStyle = {
    fontFamily: fontWordmark,
    fontSize,
    letterSpacing,
    textTransform: 'lowercase' as const,
  };

  const staticWordmark = <ChairsideBrandText variant={variant === 'small' ? 'small' : 'compact'} />;
  const shouldAnimateOnHover =
    animateSideOnHover || (onPress != null && Platform.OS === 'web');
  const usesHoverPressable =
    onPress != null || (shouldAnimateOnHover && Platform.OS === 'web');

  if (variant !== 'hero' && usesHoverPressable) {
    return (
      <Pressable
        accessibilityRole={onPress ? 'link' : 'header'}
        accessibilityLabel="chairside"
        accessibilityHint={onPress ? 'Go to home page' : undefined}
        onPress={onPress}
        style={[alignStyle, webPointer(onPress || shouldAnimateOnHover ? 'pointer' : 'default')]}>
        {({ hovered }) => (
          <WordmarkSplitText
            baseTextStyle={baseTextStyle}
            colors={colors}
            slideSide={shouldAnimateOnHover && hovered}
          />
        )}
      </Pressable>
    );
  }

  if (variant === 'hero') {
    const heroTextStyle = {
      fontFamily: fontWordmark,
      fontSize,
      letterSpacing,
      textTransform: 'lowercase' as const,
    };

    if (usesHoverPressable) {
      return (
        <Pressable
          accessibilityRole={onPress ? 'link' : 'header'}
          accessibilityLabel="chairside"
          accessibilityHint={onPress ? 'Go to home page' : undefined}
          onPress={onPress}
          style={[alignStyle, webPointer(onPress || shouldAnimateOnHover ? 'pointer' : 'default')]}>
          {({ hovered }) => (
            <WordmarkSplitText
              baseTextStyle={heroTextStyle}
              colors={colors}
              slideSide={shouldAnimateOnHover && hovered}
            />
          )}
        </Pressable>
      );
    }

    return (
      <View accessibilityRole="header" accessibilityLabel="chairside" style={alignStyle}>
        <Text style={heroTextStyle}>
          <Text style={{ color: colors.labelPrimary }}>chair</Text>
          <Text style={{ color: colors.primary }}>side</Text>
        </Text>
      </View>
    );
  }

  return (
    <View accessibilityRole="header" accessibilityLabel="chairside" style={alignStyle}>
      {staticWordmark}
    </View>
  );
}
