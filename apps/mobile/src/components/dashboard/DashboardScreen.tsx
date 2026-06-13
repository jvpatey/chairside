import { ReactNode } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';

import { Screen } from '@/components/ui/Screen';

type DashboardScreenProps = {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

/** Dashboard content shell; atmosphere is provided by `TabAtmosphereShell`. */
export function DashboardScreen({ children, contentContainerStyle }: DashboardScreenProps) {
  return (
    <Screen
      showHeader={false}
      showNotifications={false}
      contentContainerStyle={contentContainerStyle}>
      {children}
    </Screen>
  );
}
