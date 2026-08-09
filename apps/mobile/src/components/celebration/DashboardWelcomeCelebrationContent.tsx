import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import {
  getDashboardWelcomeCopy,
  type DashboardWelcomeRole,
} from '@/lib/dashboardWelcomeCopy';
import { useTheme, useThemedStyles } from '@/theme';

type DashboardWelcomeCelebrationContentProps = {
  role: DashboardWelcomeRole;
  onDismiss: () => void;
};

export function DashboardWelcomeCelebrationContent({
  role,
  onDismiss,
}: DashboardWelcomeCelebrationContentProps) {
  const { colors } = useTheme();
  const copy = getDashboardWelcomeCopy(role);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    content: {
      alignItems: 'center',
      gap: spacing.md,
    },
    iconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primarySubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      ...typography.title,
      fontSize: 24,
      textAlign: 'center',
    },
    subtitle: {
      ...typography.subtitle,
      fontSize: 16,
      lineHeight: 22,
      textAlign: 'center',
    },
    bullets: {
      alignSelf: 'stretch',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    bulletText: {
      ...typography.body,
      flex: 1,
      fontSize: 15,
      lineHeight: 21,
      color: colors.labelSecondary,
    },
    button: {
      alignSelf: 'stretch',
      marginTop: spacing.sm,
    },
  }));

  return (
    <View style={styles.content}>
      <View style={styles.iconWrap}>
        <Ionicons name="sparkles" size={28} color={colors.primary} />
      </View>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle}</Text>
      <View style={styles.bullets}>
        {copy.bullets.map((bullet) => (
          <View key={bullet} style={styles.bulletRow}>
            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
            <Text style={styles.bulletText}>{bullet}</Text>
          </View>
        ))}
      </View>
      <OnboardingButton label={copy.ctaLabel} onPress={onDismiss} style={styles.button} />
    </View>
  );
}
