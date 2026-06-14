import { ReactNode } from 'react';
import { Platform, type StyleProp, type ViewStyle } from 'react-native';

import { SignOutHeaderButton } from '@/components/navigation/SignOutHeaderButton';
import { Screen } from '@/components/ui/Screen';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

type DashboardScreenProps = {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** On tablet web, renders a page title row like other tab screens (no mobile greeting hero). */
  tabletTitle?: string;
  tabletSubtitle?: string;
};

/** Dashboard content shell; atmosphere is provided by `TabAtmosphereShell`. */
export function DashboardScreen({
  children,
  tabletTitle,
  tabletSubtitle,
  contentContainerStyle,
}: DashboardScreenProps) {
  const { isTablet } = useResponsiveLayout();
  const showWebTabletHeader =
    isTablet && Platform.OS === 'web' && Boolean(tabletTitle);

  return (
    <Screen
      showHeader={showWebTabletHeader}
      title={tabletTitle}
      subtitle={showWebTabletHeader ? tabletSubtitle : undefined}
      showNotifications={showWebTabletHeader}
      headerAccessory={
        showWebTabletHeader ? <SignOutHeaderButton /> : undefined
      }
      contentContainerStyle={contentContainerStyle}>
      {children}
    </Screen>
  );
}
