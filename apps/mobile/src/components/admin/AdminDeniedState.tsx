import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { fontBold, fontRegular, useTheme, useThemedStyles } from '@/theme';

type AdminDeniedStateProps = {
  title?: string;
  message?: string;
};

export function AdminDeniedState({
  title = 'Not available',
  message = 'This dashboard is only available to authorized Chairside admins.',
}: AdminDeniedStateProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    card: {
      alignSelf: 'center',
      maxWidth: 420,
      width: '100%',
      marginTop: 48,
      padding: spacing.xl,
      borderRadius: radii.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      alignItems: 'center',
      gap: spacing.md,
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.fillSubtle,
      marginBottom: spacing.xs,
    },
    title: {
      fontFamily: fontBold,
      fontSize: 20,
      color: colors.labelPrimary,
      textAlign: 'center',
    },
    message: {
      fontFamily: fontRegular,
      fontSize: 15,
      lineHeight: 22,
      color: colors.labelSecondary,
      textAlign: 'center',
    },
  }));

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name="lock-closed-outline" size={24} color={colors.labelSecondary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}
