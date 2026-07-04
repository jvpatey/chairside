import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colorWithAlpha, radii, useTheme, useThemedStyles } from '@/theme';

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
  disabled?: boolean;
};

const AnimatedView = Animated.createAnimatedComponent(View);

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search',
  accessibilityLabel = 'Search',
  disabled = false,
}: SearchBarProps) {
  const { colors, isDark } = useTheme();
  const [focused, setFocused] = useState(false);
  const focusProgress = useSharedValue(0);

  const focusBorderColor = colorWithAlpha(colors.primary, isDark ? 0.55 : 0.45);
  const restBackgroundColor = colors.fillSubtle;
  const focusBackgroundColor = colors.surface;

  const styles = useThemedStyles(({ spacing, typography, colors }) => ({
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.fillSubtle,
      borderRadius: radii.pill,
      borderWidth: 1.5,
      borderColor: 'transparent',
      paddingHorizontal: spacing.md,
      minHeight: 44,
    },
    searchInput: {
      flex: 1,
      minWidth: 0,
      ...typography.body,
      color: colors.labelPrimary,
      padding: 0,
    },
    disabled: {
      opacity: 0.42,
    },
  }));

  const animatedWrapStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focusProgress.value, [0, 1], ['transparent', focusBorderColor]),
    backgroundColor: interpolateColor(
      focusProgress.value,
      [0, 1],
      [restBackgroundColor, focusBackgroundColor],
    ),
  }));

  const handleFocus = () => {
    setFocused(true);
    focusProgress.value = withTiming(1, { duration: 180 });
  };

  const handleBlur = () => {
    setFocused(false);
    focusProgress.value = withTiming(0, { duration: 180 });
  };

  return (
    <AnimatedView style={[styles.searchWrap, animatedWrapStyle, disabled && styles.disabled]}>
      <Ionicons
        name="search-outline"
        size={18}
        color={focused ? colors.primary : colors.labelTertiary}
      />
      <TextInput
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
        placeholder={placeholder}
        placeholderTextColor={colors.labelTertiary}
        style={styles.searchInput}
        value={value}
        onChangeText={onChange}
        editable={!disabled}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    </AnimatedView>
  );
}
