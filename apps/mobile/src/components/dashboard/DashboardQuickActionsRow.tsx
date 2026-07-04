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
  onPress: () => void;
};

type DashboardQuickActionsRowProps = {
  actions: [DashboardQuickActionConfig, DashboardQuickActionConfig];
};

export function DashboardQuickActionsRow({ actions }: DashboardQuickActionsRowProps) {
  const { isWide } = useResponsiveLayout();
  const compact = IS_WEB && isWide;
  const styles = useThemedStyles((theme) => getDashboardLayoutStyles(theme));

  return (
    <View style={styles.quickActionSection}>
      <View style={styles.quickActionRow}>
        {actions.map((action) => (
          <DashboardQuickActionTile
            key={action.label}
            label={action.label}
            description={action.description}
            icon={action.icon}
            variant={action.variant}
            compact={compact}
            onPress={action.onPress}
          />
        ))}
      </View>
    </View>
  );
}
