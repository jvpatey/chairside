import { Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';

type SetupStepProgressProps = {
  step: number;
  total: number;
};

/** Step indicator for native setup flows — segmented bar with step count label. */
export function SetupStepProgress({ step, total }: SetupStepProgressProps) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
      gap: spacing.md,
    },
    segments: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    segment: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.fillSubtle,
    },
    segmentComplete: {
      backgroundColor: colors.primary,
    },
    segmentCurrent: {
      backgroundColor: colors.primary,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.labelSecondary,
      letterSpacing: 0.2,
    },
  }));

  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${step} of ${total}`}>
      <View style={styles.segments}>
        {Array.from({ length: total }, (_, index) => {
          const stepIndex = index + 1;
          const isCompleted = stepIndex < step;
          const isCurrent = stepIndex === step;

          return (
            <View
              key={stepIndex}
              style={[
                styles.segment,
                isCompleted && styles.segmentComplete,
                isCurrent && styles.segmentCurrent,
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
