import { Text, View } from 'react-native';

import { NotificationBell } from '@/components/notifications/NotificationBell';
import { TABLET_PROFILE_ROW_HEIGHT } from '@/lib/breakpoints';
import { useThemedStyles } from '@/theme';

type DashboardTabletSectionHeaderProps = {
  title: string;
};

/** Top dashboard row on iPad — aligns section title with sidebar profile name. */
export function DashboardTabletSectionHeader({ title }: DashboardTabletSectionHeaderProps) {
  const styles = useThemedStyles(({ spacing, typography }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: TABLET_PROFILE_ROW_HEIGHT,
      gap: spacing.sm,
    },
    title: {
      flex: 1,
      ...typography.body,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: typography.subtitle.color,
    },
  }));

  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      <NotificationBell placement="hero" />
    </View>
  );
}
