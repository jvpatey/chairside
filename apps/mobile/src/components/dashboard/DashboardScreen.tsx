import { ReactNode } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';

import { DashboardBrandHeader } from '@/components/dashboard/DashboardBrandHeader';
import { getDashboardLayoutStyles } from '@/components/dashboard/dashboardLayout';
import { SignOutHeaderButton } from '@/components/navigation/SignOutHeaderButton';
import { Screen } from '@/components/ui/Screen';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useThemedStyles } from '@/theme';

type DashboardScreenProps = {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Centered wordmark above dashboard content on phone layouts. */
  showBrandHeader?: boolean;
  /** On tablet web, renders a page title row like other tab screens (no mobile greeting hero). */
  tabletTitle?: string;
  tabletSubtitle?: string;
};

/** Dashboard content shell; atmosphere is provided by `TabAtmosphereShell`. */
export function DashboardScreen({
  children,
  showBrandHeader = false,
  tabletTitle,
  tabletSubtitle,
  contentContainerStyle,
}: DashboardScreenProps) {
  const { isTablet } = useResponsiveLayout();
  const styles = useThemedStyles((theme) => ({
    ...getDashboardLayoutStyles(theme),
  }));
  const showWebTabletHeader =
    isTablet && Platform.OS === 'web' && Boolean(tabletTitle);
  const showPhoneBrandHeader = showBrandHeader && !isTablet;

  const body = showPhoneBrandHeader ? (
    <View style={styles.flow}>
      <DashboardBrandHeader />
      {children}
    </View>
  ) : (
    children
  );

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
      {body}
    </Screen>
  );
}
