import { View } from 'react-native';

import {
  DashboardQuickActionTile,
  type DashboardQuickActionVariant,
} from '@/components/dashboard/DashboardQuickActionTile';
import { getDashboardLayoutStyles } from '@/components/dashboard/dashboardLayout';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { IS_WEB } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

export type DashboardQuickActionConfig = {
  label: string;
  description: string;
  icon: Parameters<typeof DashboardQuickActionTile>[0]['icon'];
  variant?: DashboardQuickActionVariant;
  disabled?: boolean;
  dimmed?: boolean;
  accessibilityHint?: string;
  onPress: () => void;
};

type DashboardQuickActionsRowProps = {
  actions: [DashboardQuickActionConfig] | [DashboardQuickActionConfig, DashboardQuickActionConfig];
  /** Phone stacked tiles even on a wide window (marketing preview). */
  forcePhoneLayout?: boolean;
};

export function DashboardQuickActionsRow({
  actions,
  forcePhoneLayout = false,
}: DashboardQuickActionsRowProps) {
  const { isTablet, isWide } = useResponsiveLayout();
  const compact = forcePhoneLayout ? false : IS_WEB && isWide;
  // Two-column phone rows stack icon above text so descriptions can wrap to 2 lines cleanly.
  const stackTiles = actions.length > 1 && (forcePhoneLayout || !isTablet);
  const styles = useThemedStyles((theme) => ({
    ...getDashboardLayoutStyles(theme),
    tileSlot: { flex: 1, minWidth: 0 },
  }));

  return (
    <View style={styles.quickActionSection}>
      <View style={styles.quickActionRow}>
        {actions.map((action) => (
          <View key={action.label} style={styles.tileSlot}>
            <DashboardQuickActionTile
              label={action.label}
              description={action.description}
              icon={action.icon}
              variant={action.variant}
              compact={compact}
              disabled={action.disabled}
              dimmed={action.dimmed}
              accessibilityHint={action.accessibilityHint}
              stacked={stackTiles}
              forcePhoneLayout={forcePhoneLayout}
              onPress={action.onPress}
            />
          </View>
        ))}
      </View>
    </View>
  );
}
