import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Pressable, View } from 'react-native';

import { useTheme, useThemedStyles } from '@/theme';

const CIRCLE_SIZE = 40;
const ICON_SIZE_FOCUSED = 22;
const ICON_SIZE_BLURRED = 20;

type DashboardTabIconProps = {
  focused: boolean;
};

export function DashboardTabIcon({ focused }: DashboardTabIconProps) {
  const { colors } = useTheme();

  const styles = useThemedStyles(() => ({
    circle: {
      width: CIRCLE_SIZE,
      height: CIRCLE_SIZE,
      borderRadius: CIRCLE_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: focused ? colors.primarySubtle : 'transparent',
    },
  }));

  return (
    <View style={styles.circle}>
      <Ionicons
        name="home"
        size={focused ? ICON_SIZE_FOCUSED : ICON_SIZE_BLURRED}
        color={focused ? colors.primary : colors.tabInactive}
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
