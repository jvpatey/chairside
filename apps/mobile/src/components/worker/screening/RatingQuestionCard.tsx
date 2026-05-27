import { RATING_SCALE_OPTIONS, type RatingScaleValue } from '@chairside/config';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';

type RatingQuestionCardProps = {
  prompt: string;
  value?: RatingScaleValue;
  onChange: (value: RatingScaleValue) => void;
};

export function RatingQuestionCard({ prompt, value, onChange }: RatingQuestionCardProps) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      gap: spacing.md,
    },
    prompt: {
      ...typography.body,
      fontSize: 15,
      fontWeight: '600',
    },
    scale: {
      flexDirection: 'row',
      gap: 6,
    },
    segment: {
      flex: 1,
      minHeight: 44,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: colors.separator,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.backgroundGrouped,
    },
    segmentSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      transform: [{ scale: 1.04 }],
    },
    segmentValue: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.labelPrimary,
    },
    segmentValueSelected: {
      color: colors.primaryOnPrimary,
    },
    labels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    labelText: {
      ...typography.subtitle,
      fontSize: 11,
      flex: 1,
      textAlign: 'center',
    },
  }));

  const select = (next: RatingScaleValue) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(next);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.prompt}>{prompt}</Text>
      <View style={styles.scale}>
        {RATING_SCALE_OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <Pressable
              key={option.value}
              style={[styles.segment, selected && styles.segmentSelected]}
              accessibilityRole="button"
              accessibilityLabel={`${option.label}, ${option.value}`}
              accessibilityState={{ selected }}
              onPress={() => select(option.value)}>
              <Text style={[styles.segmentValue, selected && styles.segmentValueSelected]}>
                {option.value}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.labels}>
        <Text style={styles.labelText}>Not at all</Text>
        <Text style={styles.labelText}>Strongly agree</Text>
      </View>
    </View>
  );
}
