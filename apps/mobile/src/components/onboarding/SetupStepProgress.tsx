import { Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';

type SetupStepProgressProps = {
  step: number;
  total: number;
};

/** Step indicator for native setup flows — dots with step count label. */
export function SetupStepProgress({ step, total }: SetupStepProgressProps) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
      gap: spacing.md,
    },
    dots: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    dot: {
      flex: 1,
      height: 4,
      borderRadius: 999,
      backgroundColor: colors.separator,
      opacity: 0.55,
    },
    dotCompleted: {
      backgroundColor: colors.primary,
      opacity: 1,
    },
    dotCurrent: {
      backgroundColor: colors.primary,
      opacity: 1,
      transform: [{ scaleY: 1.35 }],
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.labelSecondary,
      letterSpacing: 0.2,
    },
  }));

  return (
    <View style={styles.row} accessibilityRole="progressbar" accessibilityLabel={`Step ${step} of ${total}`}>
      <View style={styles.dots}>
        {Array.from({ length: total }, (_, index) => {
          const stepIndex = index + 1;
          const isCompleted = stepIndex < step;
          const isCurrent = stepIndex === step;

          return (
            <View
              key={stepIndex}
              style={[
                styles.dot,
                isCompleted && styles.dotCompleted,
                isCurrent && styles.dotCurrent,
              ]}
            />
          );
        })}
      </View>
      <Text style={styles.label}>
        {step}/{total}
      </Text>
    </View>
  );
}
