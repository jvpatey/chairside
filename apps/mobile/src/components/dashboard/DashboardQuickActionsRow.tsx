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
  /** Emphasize the first action (fill-ins) over the second (roles). */
  emphasizeFirst?: boolean;
};

export function DashboardQuickActionsRow({
  actions,
  forcePhoneLayout = false,
  emphasizeFirst = false,
}: DashboardQuickActionsRowProps) {
  const { isWide } = useResponsiveLayout();
  const compact = forcePhoneLayout ? false : IS_WEB && isWide;
  // Uneven flex only on wide compact rows — equal tiles on phone keeps the pair balanced.
  const emphasize = emphasizeFirst && compact && actions.length > 1;
  const styles = useThemedStyles((theme) => ({
    ...getDashboardLayoutStyles(theme),
    primaryFlex: { flex: emphasize ? 1.35 : 1, minWidth: 0 },
    secondaryFlex: { flex: 1, minWidth: 0 },
    // A lone tile spans the full row.
    singleTile: { flex: 1, minWidth: 0 },
  }));

  return (
    <View style={styles.quickActionSection}>
      <View style={styles.quickActionRow}>
        {actions.map((action, index) => (
          <View
            key={action.label}
            style={
              actions.length === 1
                ? styles.singleTile
                : index === 0
                  ? styles.primaryFlex
                  : styles.secondaryFlex
            }>
            <DashboardQuickActionTile
              label={action.label}
              description={action.description}
              icon={action.icon}
              variant={action.variant}
              compact={compact}
              disabled={action.disabled}
              dimmed={action.dimmed}
              accessibilityHint={action.accessibilityHint}
              forcePhoneLayout={forcePhoneLayout}
              onPress={action.onPress}
            />
          </View>
        ))}
      </View>
    </View>
  );
}
