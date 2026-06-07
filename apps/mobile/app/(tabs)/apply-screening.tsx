import {
  buildScreeningAnswersPayload,
  createApplication,
  getLiveJobPost,
  type ScreeningQuestion,
} from '@chairside/api';
import type { RatingScaleValue } from '@chairside/config';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { PageLoadingDetail } from '@/components/ui/PageLoadingState';
import { RatingQuestionCard } from '@/components/worker/screening/RatingQuestionCard';
import { NumberQuestionCard } from '@/components/worker/screening/NumberQuestionCard';
import { TextQuestionCard } from '@/components/worker/screening/TextQuestionCard';
import { ScreeningIntroCard } from '@/components/worker/screening/ScreeningIntroCard';
import { ScreeningWizardShell } from '@/components/worker/screening/ScreeningWizardShell';
import { YesNoQuestionCard } from '@/components/worker/screening/YesNoQuestionCard';
import { useAuth } from '@/contexts/AuthContext';
import { WORKER_APPLICATIONS } from '@/lib/routing';
import {
  buildScreeningWizardPages,
  countAnsweredQuestions,
  getScreeningQuestionKey,
  isScreeningPageComplete,
  type ScreeningAnswerValue,
} from '@/lib/screeningWizard';
import { useThemedStyles } from '@/theme';

export default function ApplyScreeningScreen() {
  const { user } = useAuth();
  const { postId } = useLocalSearchParams<{
    postId?: string;
  }>();
  const jobId = typeof postId === 'string' ? postId : '';

  const [questions, setQuestions] = useState<ScreeningQuestion[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, ScreeningAnswerValue | undefined>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pages = useMemo(() => buildScreeningWizardPages(questions), [questions]);
  const currentPage = pages[pageIndex];

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    content: { gap: spacing.lg },
    reviewCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    reviewTitle: {
      ...typography.body,
      fontWeight: '700',
      fontSize: 17,
    },
    reviewMeta: typography.subtitle,
    footer: {
      gap: spacing.sm,
    },
  }));

  const loadJob = useCallback(async () => {
    if (!jobId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const job = await getLiveJobPost(jobId);
      if (!job?.screening_enabled || job.screening_questions.length === 0) {
        Alert.alert('Screening unavailable', 'This role no longer includes screening.');
        router.back();
        return;
      }
      setQuestions(job.screening_questions);
    } catch (error) {
      Alert.alert(
        'Could not load screening',
        error instanceof Error ? error.message : 'Please try again.',
      );
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    void loadJob();
  }, [loadJob]);

  const submitScreening = async () => {
    if (!user?.id || !jobId) return;

    setIsSubmitting(true);
    try {
      await createApplication(user.id, {
        jobPostId: jobId,
        screeningOnly: true,
        screening: {
          status: 'completed',
          answers: buildScreeningAnswersPayload(questions, answers),
        },
      });
      router.replace(WORKER_APPLICATIONS);
    } catch (error) {
      Alert.alert(
        'Submission failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = () => {
    if (!currentPage) return;

    if (currentPage.kind === 'review') {
      void submitScreening();
      return;
    }

    if (currentPage.kind === 'questions' && !isScreeningPageComplete(currentPage, answers)) {
      Alert.alert('Answer required', 'Answer each question on this page to continue.');
      return;
    }

    setPageIndex((current) => Math.min(current + 1, pages.length - 1));
  };

  const handleBack = () => {
    if (pageIndex === 0) {
      router.back();
      return;
    }
    setPageIndex((current) => current - 1);
  };

  if (isLoading || !currentPage) {
    return (
      <OnboardingShell>
        <AuthScreenHeader
          title="Screening questions"
          subtitle={isLoading ? undefined : 'Unavailable'}
          onBack={() => router.back()}
        />
        {isLoading ? <PageLoadingDetail /> : null}
      </OnboardingShell>
    );
  }

  const answeredCount = countAnsweredQuestions(questions, answers);
  const continueLabel =
    currentPage.kind === 'review'
      ? isSubmitting
        ? 'Submitting…'
        : 'Submit screening'
      : 'Continue';

  return (
    <OnboardingShell
      footer={
        <View style={styles.footer}>
          <OnboardingButton
            label={continueLabel}
            disabled={isSubmitting}
            onPress={handleContinue}
          />
        </View>
      }>
      <AuthScreenHeader
        title="Screening questions"
        subtitle="Required before your screening submission is sent"
        onBack={handleBack}
      />

      <View style={styles.content}>
        <ScreeningWizardShell
          stepIndex={pageIndex}
          totalSteps={pages.length}
          title={
            currentPage.kind === 'intro'
              ? 'Before you apply'
              : currentPage.kind === 'review'
                ? 'Ready to submit'
                : currentPage.questions[0]?.type === 'rating_1_5'
                  ? 'Rate these attributes'
                  : 'Screening questions'
          }
          subtitle={
            currentPage.kind === 'questions' && currentPage.questions[0]?.type === 'rating_1_5'
              ? '5 = Strongly agree · 0 = Not at all'
              : undefined
          }>
          {currentPage.kind === 'intro' ? (
            <ScreeningIntroCard />
          ) : null}

          {currentPage.kind === 'questions'
            ? currentPage.questions.map((question) => {
                const key = getScreeningQuestionKey(question);
                if (question.type === 'yes_no') {
                  return (
                    <YesNoQuestionCard
                      key={key}
                      prompt={question.prompt}
                      value={answers[key] as boolean | undefined}
                      onChange={(value) =>
                        setAnswers((current) => ({ ...current, [key]: value }))
                      }
                    />
                  );
                }

                if (question.type === 'number') {
                  return (
                    <NumberQuestionCard
                      key={key}
                      prompt={question.prompt}
                      value={answers[key] as number | undefined}
                      min={question.min}
                      max={question.max}
                      unitLabel={question.unitLabel}
                      onChange={(value) =>
                        setAnswers((current) => ({ ...current, [key]: value }))
                      }
                    />
                  );
                }

                if (question.type === 'text') {
                  return (
                    <TextQuestionCard
                      key={key}
                      prompt={question.prompt}
                      value={answers[key] as string | undefined}
                      onChange={(value) =>
                        setAnswers((current) => ({ ...current, [key]: value }))
                      }
                    />
                  );
                }

                return (
                  <RatingQuestionCard
                    key={key}
                    prompt={question.prompt}
                    value={answers[key] as RatingScaleValue | undefined}
                    onChange={(value) => setAnswers((current) => ({ ...current, [key]: value }))}
                  />
                );
              })
            : null}

          {currentPage.kind === 'review' ? (
            <View style={styles.reviewCard}>
              <Text style={styles.reviewTitle}>Screening ready</Text>
              <Text style={styles.reviewMeta}>
                You answered {answeredCount} of {questions.length} screening question
                {questions.length === 1 ? '' : 's'}. The clinic will review your responses and can
                request your full application kit if they want to continue.
              </Text>
            </View>
          ) : null}
        </ScreeningWizardShell>
      </View>
    </OnboardingShell>
  );
}
