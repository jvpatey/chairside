import { Platform, Text, View } from 'react-native';

import { SignOutHeaderButton } from '@/components/navigation/SignOutHeaderButton';
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
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: typography.subtitle.color,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flexShrink: 0,
    },
  }));

  const showSignOut = Platform.OS === 'web';

  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.actions}>
        <NotificationBell placement="hero" />
        {showSignOut ? <SignOutHeaderButton /> : null}
      </View>
    </View>
  );
}
