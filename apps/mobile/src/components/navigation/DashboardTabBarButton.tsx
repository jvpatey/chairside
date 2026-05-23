import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Pressable, View } from 'react-native';

import { useTheme, useThemedStyles } from '@/theme';

const CIRCLE_SIZE_FOCUSED = 48;
const CIRCLE_SIZE_BLURRED = 42;
const ICON_SIZE_FOCUSED = 22;
const ICON_SIZE_BLURRED = 20;

type DashboardTabIconProps = {
  focused: boolean;
};

export function DashboardTabIcon({ focused }: DashboardTabIconProps) {
  const { colors } = useTheme();
  const size = focused ? CIRCLE_SIZE_FOCUSED : CIRCLE_SIZE_BLURRED;

  const styles = useThemedStyles(() => ({
    circle: {
      alignItems: 'center',
      justifyContent: 'center',
    },
  }));

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: focused ? colors.primary : colors.fillSubtle,
        },
      ]}>
      <Ionicons
        name="home"
        size={focused ? ICON_SIZE_FOCUSED : ICON_SIZE_BLURRED}
        color={focused ? colors.primaryOnPrimary : colors.tabInactive}
      />
    </View>
  );
}

export function DashboardTabBarButton(props: BottomTabBarButtonProps) {
  const styles = useThemedStyles(() => ({
    button: {
      justifyContent: 'center',
      alignItems: 'center',
    },
  }));

  return (
    <Pressable
      {...props}
      style={(state) => [
        typeof props.style === 'function' ? props.style(state) : props.style,
        styles.button,
      ]}
    />
  );
}
