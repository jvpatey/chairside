import {
  getJobPostScreeningQuestions,
  type ApplicationScreening,
  type ScreeningQuestion,
} from '@chairside/api';
import {
  formatScreeningAnswerValue,
  formatScreeningRequirementLabel,
  getScreeningCatalogQuestion,
  RATING_SCALE_OPTIONS,
} from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ApplicationPreviewGroup } from '@/components/worker/ApplicationPreviewGroup';
import {
  getScreeningOutcomeLabel,
  partitionScreeningAnswers,
  resolveScreeningKnockout,
} from '@/lib/screeningTriage';
import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type ApplicationScreeningSectionProps = {
  screening: ApplicationScreening;
  audience?: 'clinic' | 'worker';
  onExpandedChange?: (expanded: boolean) => void;
  /** When true, start expanded (clinic screening stage). */
  defaultExpanded?: boolean;
  /** Used to resolve must-pass requirements for clinic review. */
  jobPostId?: string | null;
};

function formatAnswer(
  type: 'yes_no' | 'rating_1_5' | 'number' | 'text',
  answer: boolean | number | string,
  unitLabel?: string,
): string {
  if (type === 'rating_1_5') {
    const option = RATING_SCALE_OPTIONS.find((item) => item.value === answer);
    return option ? `${answer} · ${option.label}` : String(answer);
  }
  return formatScreeningAnswerValue(type, answer, unitLabel);
}

type ApplicationScreeningPreviewProps = {
  screening: ApplicationScreening;
  audience?: 'clinic' | 'worker';
  defaultExpanded?: boolean;
};

export function ApplicationScreeningPreview({
  screening,
  audience = 'clinic',
  defaultExpanded,
}: ApplicationScreeningPreviewProps) {
  const { colors } = useTheme();
  const initiallyExpanded = defaultExpanded ?? false;
  const [expanded, setExpanded] = useState(initiallyExpanded);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    skippedText: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    toggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      minWidth: 0,
      ...webPointer(),
    },
    toggleHovered: webListRowHoverStyles(colors),
    togglePressed: {
      opacity: 0.88,
    },
    toggleLabel: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.45,
      textTransform: 'uppercase',
      color: colors.labelTertiary,
      flex: 1,
      minWidth: 0,
    },
    list: {
      gap: spacing.xs,
      paddingTop: spacing.xs,
    },
    answerRow: {
      gap: 4,
      paddingVertical: spacing.xs,
    },
    prompt: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.3,
      color: colors.labelSecondary,
    },
    answer: {
      ...typography.body,
      fontSize: 15,
      lineHeight: 21,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    reverseNote: {
      ...typography.subtitle,
      fontSize: 12,
      lineHeight: 17,
      fontStyle: 'italic',
      color: colors.labelTertiary,
    },
  }));

  if (screening.status === 'skipped') {
    return (
      <ApplicationPreviewGroup title="Screening">
        <Text style={styles.skippedText}>
          {audience === 'worker'
            ? 'You skipped screening questions for this application.'
            : 'Screening skipped by applicant'}
        </Text>
      </ApplicationPreviewGroup>
    );
  }

  const questions = screening.answers?.questions ?? [];
  if (questions.length === 0) return null;

  const toggleLabel =
    audience === 'worker'
      ? `Your screening responses (${questions.length})`
      : `Screening responses (${questions.length})`;

  return (
    <ApplicationPreviewGroup>
      <Pressable
        style={({ pressed, hovered }) => [
          styles.toggle,
          webHover(hovered, pressed, styles.toggleHovered),
          pressed && styles.togglePressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((current) => !current)}>
        <Text style={styles.toggleLabel}>{toggleLabel}</Text>
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
    </ApplicationPreviewGroup>
  );
}

export function ApplicationScreeningSection({
  screening,
  audience = 'clinic',
  onExpandedChange,
  defaultExpanded = false,
  jobPostId,
}: ApplicationScreeningSectionProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [jobQuestions, setJobQuestions] = useState<ScreeningQuestion[]>([]);
  const isClinic = audience === 'clinic';

  useEffect(() => {
    if (!isClinic || !jobPostId) {
      setJobQuestions([]);
      return;
    }

    let cancelled = false;
    void getJobPostScreeningQuestions(jobPostId)
      .then((questions) => {
        if (!cancelled) setJobQuestions(questions);
      })
      .catch(() => {
        if (!cancelled) setJobQuestions([]);
      });

    return () => {
      cancelled = true;
    };
  }, [isClinic, jobPostId]);

  useEffect(() => {
    if (defaultExpanded) {
      onExpandedChange?.(true);
    }
    // Auto-expand on screening stage should mark review seen once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setScreeningExpanded = (next: boolean) => {
    setExpanded(next);
    onExpandedChange?.(next);
  };

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    summary: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
    outcomeBanner: {
      borderRadius: 12,
      padding: spacing.sm,
      gap: 4,
    },
    outcomeBannerPass: {
      backgroundColor: `${colors.success}14`,
      borderWidth: 1,
      borderColor: `${colors.success}33`,
    },
    outcomeBannerFlagged: {
      backgroundColor: `${colors.warning}14`,
      borderWidth: 1,
      borderColor: `${colors.warning}33`,
    },
    outcomeTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.labelPrimary,
    },
    outcomeBody: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
    toggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 10,
      ...webPointer(),
    },
    toggleHovered: webListRowHoverStyles(colors),
    togglePressed: {
      opacity: 0.88,
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
      gap: spacing.md,
    },
    group: {
      gap: spacing.sm,
    },
    groupTitle: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.labelTertiary,
    },
    answerRow: {
      backgroundColor: colors.backgroundGrouped,
      borderRadius: 12,
      padding: spacing.sm,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.sm,
      flexWrap: 'wrap',
    },
    answerRowFailed: {
      borderWidth: 1,
      borderColor: `${colors.warning}55`,
      backgroundColor: `${colors.warning}10`,
    },
    prompt: {
      ...typography.body,
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
    answerChip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
      maxWidth: '100%',
      gap: 1,
    },
    answerChipYes: {
      backgroundColor: `${colors.success}14`,
      borderColor: `${colors.success}33`,
    },
    answerChipFailed: {
      backgroundColor: `${colors.warning}18`,
      borderColor: `${colors.warning}44`,
    },
    answerChipRequired: {
      backgroundColor: colors.surface,
      borderColor: colors.separator,
    },
    chipStack: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
      gap: 6,
      maxWidth: '100%',
    },
    chipCaption: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.3,
      textTransform: 'uppercase',
      color: colors.labelTertiary,
    },
    flaggedBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: `${colors.warning}18`,
      borderWidth: 1,
      borderColor: `${colors.warning}44`,
    },
    flaggedBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.labelPrimary,
    },
    promptBlock: {
      flex: 1,
      minWidth: 140,
      gap: 6,
    },
    answer: {
      ...typography.subtitle,
      fontSize: 13,
      fontWeight: '700',
      color: colors.labelPrimary,
    },
    reverseNote: {
      ...typography.subtitle,
      fontSize: 11,
      fontStyle: 'italic',
      width: '100%',
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

  const { qualifications, culture } = partitionScreeningAnswers(questions);
  const failed = new Set(screening.failedQuestionIds ?? []);
  const outcomeLabel = isClinic ? getScreeningOutcomeLabel(screening.outcome) : null;

  const toggleLabel =
    audience === 'worker'
      ? `Your responses (${questions.length})`
      : `View all responses (${questions.length})`;

  const renderGroup = (title: string, items: typeof questions) => {
    if (items.length === 0) return null;
    return (
      <View style={styles.group}>
        <Text style={styles.groupTitle}>
          {title} · {items.length}
        </Text>
        {items.map((item) => {
          const failedRow = failed.has(item.id);
          const catalog = getScreeningCatalogQuestion(item.id);
          const answerText = formatAnswer(
            item.type,
            item.answer as boolean | number | string,
            catalog?.unitLabel,
          );
          const requiredText = isClinic
            ? formatScreeningRequirementLabel(
                item.type,
                resolveScreeningKnockout(item, jobQuestions),
                catalog?.unitLabel,
              )
            : null;
          const yesChip = item.type === 'yes_no' && item.answer === true && !failedRow;
          return (
            <View
              key={item.id}
              style={[styles.answerRow, failedRow && styles.answerRowFailed]}>
              <View style={styles.promptBlock}>
                {failedRow ? (
                  <View style={styles.flaggedBadge}>
                    <Text style={styles.flaggedBadgeText}>Flagged</Text>
                  </View>
                ) : null}
                <Text style={styles.prompt}>{item.prompt}</Text>
              </View>
              <View style={styles.chipStack}>
                <View
                  style={[
                    styles.answerChip,
                    yesChip && styles.answerChipYes,
                    failedRow && styles.answerChipFailed,
                  ]}>
                  {isClinic ? <Text style={styles.chipCaption}>Response</Text> : null}
                  <Text style={styles.answer}>{answerText}</Text>
                </View>
                {requiredText ? (
                  <View style={[styles.answerChip, styles.answerChipRequired]}>
                    <Text style={styles.chipCaption}>Required</Text>
                    <Text style={styles.answer}>{requiredText}</Text>
                  </View>
                ) : null}
              </View>
              {item.reverseScored ? (
                <Text style={styles.reverseNote}>Lower scores are preferred for this trait.</Text>
              ) : null}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.wrap}>
      {isClinic ? (
        <Text style={styles.summary}>
          Qualifications · {qualifications.length}
          {culture.length > 0 ? ` · Culture · ${culture.length}` : ''}
        </Text>
      ) : null}

      {isClinic && screening.outcome === 'flagged' ? (
        <View style={[styles.outcomeBanner, styles.outcomeBannerFlagged]}>
          <Text style={styles.outcomeTitle}>{outcomeLabel ?? 'Flagged'}</Text>
          <Text style={styles.outcomeBody}>
            Did not meet:{' '}
            {(screening.failedQuestionIds ?? [])
              .map((id) => getScreeningCatalogQuestion(id)?.shortLabel ?? id)
              .join(', ') || 'must-pass requirements'}
          </Text>
        </View>
      ) : null}

      {isClinic && screening.outcome === 'pass' ? (
        <View style={[styles.outcomeBanner, styles.outcomeBannerPass]}>
          <Text style={styles.outcomeTitle}>Qualified</Text>
          <Text style={styles.outcomeBody}>Met must-pass screening requirements.</Text>
        </View>
      ) : null}

      <Pressable
        style={({ pressed, hovered }) => [
          styles.toggle,
          webHover(hovered, pressed, styles.toggleHovered),
          pressed && styles.togglePressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setScreeningExpanded(!expanded)}>
        <Text style={styles.toggleText}>{toggleLabel}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.labelTertiary}
        />
      </Pressable>

      {expanded ? (
        <View style={styles.list}>
          {isClinic ? (
            <>
              {renderGroup('Qualifications', qualifications)}
              {renderGroup('Culture & work style', culture)}
            </>
          ) : (
            <View style={styles.group}>
              {questions.map((item) => (
                <View key={item.id} style={styles.answerRow}>
                  <Text style={styles.prompt}>{item.prompt}</Text>
                  <View style={styles.answerChip}>
                    <Text style={styles.answer}>
                      {formatAnswer(
                        item.type,
                        item.answer as boolean | number | string,
                        getScreeningCatalogQuestion(item.id)?.unitLabel,
                      )}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}
