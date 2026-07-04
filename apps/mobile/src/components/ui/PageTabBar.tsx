import * as Haptics from 'expo-haptics';
import { Platform, Pressable, Text, View } from 'react-native';

import { SlidingSegmentIndicator } from '@/components/ui/SlidingSegmentIndicator';
import { useTabAtmosphereAccent } from '@/contexts/TabAtmosphereContext';
import { useSlidingSegmentIndicator } from '@/hooks/useSlidingSegmentIndicator';
import { webHover, webPointer } from '@/lib/webPressableStyles';
import { fontSemibold, useTheme, useThemedStyles, type GradientAccent } from '@/theme';

type PageTabBarDensity = 'default' | 'compact';

const UNDERLINE_HEIGHT = 2;

type PageTabBarProps<T extends string> = {
  options: { value: T; label: string }[];
  selected: T;
  onChange: (value: T) => void;
  density?: PageTabBarDensity;
  accent?: GradientAccent;
};

export function PageTabBar<T extends string>({
  options,
  selected,
  onChange,
  density = 'default',
  accent,
}: PageTabBarProps<T>) {
  const tabAccent = useTabAtmosphereAccent();
  const { colors } = useTheme();
  const resolvedAccent = accent ?? tabAccent;
  const brandColor = resolvedAccent === 'secondary' ? colors.secondary : colors.primary;
  const isCompact = density === 'compact';
  const useSlidingIndicator = Platform.OS === 'web';

  const selectedIndex = options.findIndex((option) => option.value === selected);
  const resolvedSelectedIndex = selectedIndex >= 0 ? selectedIndex : 0;

  const { animatedStyle: indicatorStyle, onSegmentLayout } = useSlidingSegmentIndicator(
    resolvedSelectedIndex,
    'horizontal',
    UNDERLINE_HEIGHT,
  );

  const styles = useThemedStyles(({ colors, spacing }) => ({
    wrap: {
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
    },
    row: {
      flexDirection: 'row',
      position: 'relative',
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: isCompact ? spacing.xs : spacing.sm,
      paddingBottom: isCompact ? spacing.sm : spacing.md,
      paddingHorizontal: spacing.xs,
      minHeight: isCompact ? 40 : 44,
      ...webPointer(),
    },
    tabHovered: {
      opacity: 0.88,
    },
    label: {
      fontSize: isCompact ? 14 : 15,
      lineHeight: isCompact ? 18 : 20,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelTertiary,
      textAlign: 'center',
    },
    indicator: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      height: UNDERLINE_HEIGHT,
      borderRadius: 1,
    },
    nativeIndicator: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: UNDERLINE_HEIGHT,
      borderRadius: 1,
    },
  }));

  const accentStyle = { color: brandColor };
  const indicatorAccentStyle = { backgroundColor: brandColor };

  const handleSelect = (value: T) => {
    void Haptics.selectionAsync();
    onChange(value);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {useSlidingIndicator ? (
          <SlidingSegmentIndicator
            animatedStyle={indicatorStyle}
            style={[styles.indicator, indicatorAccentStyle]}
          />
        ) : null}
        {options.map((option, index) => {
          const isSelected = selected === option.value;

          return (
            <View
              key={option.value}
              style={{ flex: 1 }}
              onLayout={
                useSlidingIndicator
                  ? (event) => {
                      const { x, y, width, height } = event.nativeEvent.layout;
                      onSegmentLayout(index, { x, y, width, height });
                    }
                  : undefined
              }>
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={option.label}
                onPress={() => handleSelect(option.value)}
                style={({ pressed, hovered }) => [
                  styles.tab,
                  webHover(hovered, pressed, styles.tabHovered),
                  pressed && { opacity: 0.75 },
                ]}>
                <Text
                  style={[styles.label, isSelected && accentStyle]}
                  numberOfLines={1}
                  adjustsFontSizeToFit={isCompact}
                  minimumFontScale={0.85}>
                  {option.label}
                </Text>
                {!useSlidingIndicator && isSelected ? (
                  <View style={[styles.nativeIndicator, indicatorAccentStyle]} />
                ) : null}
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
