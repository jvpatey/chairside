import { Text, View } from 'react-native';

import {
  formatAdminPlanLabel,
  formatAdminStatusLabel,
  getPlanAccent,
  getStatusAccent,
} from '@/components/admin/adminLabels';
import { fontSemibold, useTheme, useThemedStyles } from '@/theme';

export function AdminPlanBadge({ plan }: { plan: string }) {
  const { colors } = useTheme();
  const accent = getPlanAccent(plan, colors);
  const styles = useThemedStyles(() => ({
    badge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    text: {
      fontFamily: fontSemibold,
      fontSize: 12,
    },
  }));

  return (
    <View style={[styles.badge, { backgroundColor: accent.bg }]}>
      <Text style={[styles.text, { color: accent.fg }]}>{formatAdminPlanLabel(plan)}</Text>
    </View>
  );
}

export function AdminStatusPill({ status }: { status: string }) {
  const { colors } = useTheme();
  const accent = getStatusAccent(status, colors);
  const styles = useThemedStyles(() => ({
    badge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    text: {
      fontFamily: fontSemibold,
      fontSize: 12,
    },
  }));

  return (
    <View style={[styles.badge, { backgroundColor: accent.bg }]}>
      <Text style={[styles.text, { color: accent.fg }]}>{formatAdminStatusLabel(status)}</Text>
    </View>
  );
}
