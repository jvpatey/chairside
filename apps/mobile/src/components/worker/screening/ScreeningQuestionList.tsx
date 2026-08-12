import type { ScreeningQuestion } from '@chairside/api';
import type { RatingScaleValue } from '@chairside/config';
import { Text, View } from 'react-native';

import { NumberQuestionCard } from '@/components/worker/screening/NumberQuestionCard';
import { RatingQuestionCard } from '@/components/worker/screening/RatingQuestionCard';
import { TextQuestionCard } from '@/components/worker/screening/TextQuestionCard';
import { YesNoQuestionCard } from '@/components/worker/screening/YesNoQuestionCard';
import {
  getScreeningQuestionKey,
  sortScreeningQuestions,
  type ScreeningAnswerValue,
} from '@/lib/screeningWizard';
import { useThemedStyles } from '@/theme';

type ScreeningQuestionListProps = {
  questions: ScreeningQuestion[];
  answers?: Record<string, ScreeningAnswerValue | undefined>;
  onChange?: (key: string, value: ScreeningAnswerValue) => void;
  interactive?: boolean;
};

function previewAnswer(question: ScreeningQuestion): ScreeningAnswerValue {
  if (question.type === 'yes_no') return true;
  if (question.type === 'number') return question.min ?? 0;
  if (question.type === 'text') return 'Sample answer';
  return 4 as RatingScaleValue;
}

export function ScreeningQuestionList({
  questions,
  answers = {},
  onChange,
  interactive = true,
}: ScreeningQuestionListProps) {
  const sorted = sortScreeningQuestions(questions);
  const firstRating = sorted.find((question) => question.type === 'rating_1_5');
  const firstRatingKey = firstRating ? getScreeningQuestionKey(firstRating) : null;

  const styles = useThemedStyles(({ spacing, typography }) => ({
    list: {
      gap: spacing.sm,
    },
    ratingIntro: {
      gap: 2,
      paddingTop: spacing.xs,
    },
    ratingTitle: {
      ...typography.body,
      fontSize: 15,
      fontWeight: '700',
    },
    ratingHint: {
      ...typography.subtitle,
      fontSize: 13,
    },
  }));

  return (
    <View style={styles.list} pointerEvents={interactive ? 'auto' : 'none'}>
      {sorted.map((question) => {
        const key = getScreeningQuestionKey(question);
        const value = interactive ? answers[key] : previewAnswer(question);
        const showRatingLegend = question.type === 'rating_1_5' && key === firstRatingKey;

        return (
          <View key={key} style={showRatingLegend ? styles.ratingIntro : undefined}>
            {showRatingLegend ? (
              <>
                <Text style={styles.ratingTitle}>Rate these attributes</Text>
                <Text style={styles.ratingHint}>5 = Strongly agree · 1 = Not at all</Text>
              </>
            ) : null}

            {question.type === 'yes_no' ? (
              <YesNoQuestionCard
                compact
                prompt={question.prompt}
                value={value as boolean | undefined}
                onChange={(next) => onChange?.(key, next)}
              />
            ) : null}

            {question.type === 'number' ? (
              <NumberQuestionCard
                compact
                prompt={question.prompt}
                value={value as number | undefined}
                min={question.min}
                max={question.max}
                unitLabel={question.unitLabel}
                onChange={(next) => onChange?.(key, next)}
              />
            ) : null}

            {question.type === 'text' ? (
              <TextQuestionCard
                compact
                prompt={question.prompt}
                value={typeof value === 'string' ? value : ''}
                onChange={(next) => onChange?.(key, next)}
              />
            ) : null}

            {question.type === 'rating_1_5' ? (
              <RatingQuestionCard
                compact
                showScaleLabels={false}
                prompt={question.prompt}
                value={value as RatingScaleValue | undefined}
                onChange={(next) => onChange?.(key, next)}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
