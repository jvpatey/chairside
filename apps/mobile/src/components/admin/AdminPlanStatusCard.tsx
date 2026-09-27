import { StyleSheet, Text, View } from 'react-native';

import { AdminDistributionBars } from '@/components/admin/AdminDistributionBars';
import {
  formatAdminStatusLabel,
  getStatusAccent,
} from '@/components/admin/adminLabels';
import { fontBold, fontSemibold, useTheme, useThemedStyles } from '@/theme';

type PlanItem = {
  key: string;
  label: string;
  count: number;
  color: string;
};

type StatusItem = {
  status: string;
  count: number;
};

type AdminPlanStatusCardProps = {
  planItems: PlanItem[];
  statusItems: StatusItem[];
  compact?: boolean;
};

export function AdminPlanStatusCard({
  planItems,
  statusItems,
  compact = false,
}: AdminPlanStatusCardProps) {
  const { colors, spacing } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    card: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      gap: spacing.lg,
    },
    sectionTitle: {
      fontFamily: fontBold,
      fontSize: 16,
      color: colors.labelPrimary,
      marginBottom: spacing.sm,
    },
    statusTitle: {
      fontFamily: fontSemibold,
      fontSize: 13,
      color: colors.labelSecondary,
      marginBottom: spacing.sm,
    },
    statusRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    statusChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radii.pill,
    },
    statusChipLabel: {
      fontFamily: fontSemibold,
      fontSize: 12,
    },
    statusChipValue: {
      fontFamily: fontBold,
      fontSize: 13,
      color: colors.labelPrimary,
    },
  }));

  return (
    <View
      style={[
        styles.card,
        {
          minWidth: compact ? 0 : 280,
          width: compact ? '100%' : undefined,
          padding: compact ? spacing.md : spacing.lg,
        },
      ]}>
      <View>
        <Text style={styles.sectionTitle}>Plans & status</Text>
        <AdminDistributionBars title="" items={planItems} showPercent={false} variant="plain" />
      </View>
      <View>
        <Text style={styles.statusTitle}>Subscription status</Text>
        <View style={styles.statusRow}>
          {statusItems.length === 0 ? (
            <Text style={{ fontFamily: fontSemibold, fontSize: 13, color: colors.labelTertiary }}>
              No clinics yet
            </Text>
          ) : (
            statusItems.map((row) => {
              const accent = getStatusAccent(row.status, colors);
              return (
                <View
                  key={row.status}
                  style={[styles.statusChip, { backgroundColor: accent.bg }]}>
                  <Text style={[styles.statusChipLabel, { color: accent.fg }]}>
                    {formatAdminStatusLabel(row.status)}
                  </Text>
                  <Text style={styles.statusChipValue}>{row.count.toLocaleString()}</Text>
                </View>
              );
            })
          )}
        </View>
      </View>
    </View>
  );
}
