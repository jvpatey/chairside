import type { ApplicationScreening } from '@chairside/api';
import { getScreeningCatalogQuestion, RATING_SCALE_OPTIONS } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme, useThemedStyles } from '@/theme';

type ApplicationScreeningSectionProps = {
  screening: ApplicationScreening;
  audience?: 'clinic' | 'worker';
};

function formatYesNo(answer: boolean): string {
  return answer ? 'Yes' : 'No';
}

function formatRating(answer: number): string {
  const option = RATING_SCALE_OPTIONS.find((item) => item.value === answer);
  return option ? `${answer} · ${option.label}` : String(answer);
}

function formatAnswer(
  type: 'yes_no' | 'rating_1_5' | 'number' | 'text',
  answer: boolean | number | string,
  unitLabel?: string,
): string {
  if (type === 'yes_no') return formatYesNo(answer as boolean);
  if (type === 'text') return String(answer).trim();
  if (type === 'number') {
    const value = String(answer);
    return unitLabel ? `${value} ${unitLabel}` : value;
  }
  return formatRating(answer as number);
}

export function ApplicationScreeningSection({
  screening,
  audience = 'clinic',
}: ApplicationScreeningSectionProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(audience === 'worker');

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    toggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    toggleText: {
      ...typography.body,
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    skippedBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.backgroundGrouped,
      borderRadius: 999,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    skippedText: {
      ...typography.subtitle,
      fontSize: 12,
      fontWeight: '600',
    },
    list: {
      gap: spacing.sm,
    },
    answerRow: {
      backgroundColor: colors.backgroundGrouped,
      borderRadius: 12,
      padding: spacing.sm,
      gap: 4,
    },
    prompt: {
      ...typography.body,
      fontSize: 13,
      lineHeight: 18,
    },
    answer: {
      ...typography.subtitle,
      fontSize: 13,
      fontWeight: '600',
    },
    reverseNote: {
      ...typography.subtitle,
      fontSize: 11,
      fontStyle: 'italic',
    },
  }));

  if (screening.status === 'skipped') {
    return (
      <View style={styles.wrap}>
        <View style={styles.skippedBadge}>
          <Text style={styles.skippedText}>
            {audience === 'worker'
              ? 'You skipped screening questions'
              : 'Screening skipped by applicant'}
          </Text>
        </View>
      </View>
    );
  }

  const questions = screening.answers?.questions ?? [];
  if (questions.length === 0) return null;

  const toggleLabel =
    audience === 'worker'
      ? `Your responses (${questions.length})`
      : `Screening responses (${questions.length})`;

  return (
    <View style={styles.wrap}>
      <Pressable
        style={styles.toggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((current) => !current)}>
        <Text style={styles.toggleText}>{toggleLabel}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.labelTertiary}
        />
      </Pressable>

      {expanded ? (
        <View style={styles.list}>
          {questions.map((item) => (
            <View key={item.id} style={styles.answerRow}>
              <Text style={styles.prompt}>{item.prompt}</Text>
              <Text style={styles.answer}>
                {formatAnswer(
                  item.type,
                  item.answer as boolean | number | string,
                  getScreeningCatalogQuestion(item.id)?.unitLabel,
                )}
              </Text>
              {item.reverseScored ? (
                <Text style={styles.reverseNote}>Lower scores are preferred for this trait.</Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
