import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';

export function ClinicProfileLinkFooter() {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: spacing.xs,
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.separator,
    },
    label: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
      color: colors.primary,
      fontWeight: '600',
    },
  }));

  return (
    <View style={styles.row}>
      <Text style={styles.label}>View clinic profile</Text>
      <Ionicons name="chevron-forward" size={14} color={styles.label.color} />
    </View>
  );
}
