import { Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';

type ScreeningWizardShellProps = {
  stepIndex: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function ScreeningWizardShell({
  stepIndex,
  totalSteps,
  title,
  subtitle,
  children,
}: ScreeningWizardShellProps) {
  const progress = totalSteps > 0 ? ((stepIndex + 1) / totalSteps) * 100 : 0;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      gap: spacing.lg,
    },
    progressTrack: {
      height: 4,
      borderRadius: 999,
      backgroundColor: colors.separator,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 999,
    },
    stepLabel: {
      ...typography.subtitle,
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    title: {
      ...typography.body,
      fontSize: 20,
      fontWeight: '700',
    },
    subtitle: typography.subtitle,
    content: {
      gap: spacing.md,
    },
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.stepLabel}>
        Step {stepIndex + 1} of {totalSteps}
      </Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.content}>{children}</View>
    </View>
  );
}
