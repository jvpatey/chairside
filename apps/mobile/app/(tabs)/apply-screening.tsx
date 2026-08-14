import {
  buildScreeningAnswersPayload,
  createApplication,
  getLiveJobPost,
  type ScreeningQuestion,
} from '@chairside/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { FormScreen } from '@/components/ui/FormScreen';
import { PageLoadingDetail } from '@/components/ui/PageLoadingState';
import { ScreeningIntroCard } from '@/components/worker/screening/ScreeningIntroCard';
import { ScreeningQuestionList } from '@/components/worker/screening/ScreeningQuestionList';
import { useAuth } from '@/contexts/AuthContext';
import { WORKER_APPLICATIONS } from '@/lib/routing';
import {
  countAnsweredQuestions,
  isScreeningFormComplete,
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
  const [answers, setAnswers] = useState<Record<string, ScreeningAnswerValue | undefined>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    content: { gap: spacing.md },
    progress: {
      ...typography.subtitle,
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
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
    if (!isScreeningFormComplete(questions, answers)) {
      Alert.alert('Answer required', 'Answer every screening question to submit.');
      return;
    }

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

  if (isLoading) {
    return (
      <FormScreen title="Screening questions" onBack={() => router.back()}>
        <PageLoadingDetail />
      </FormScreen>
    );
  }

  const answeredCount = countAnsweredQuestions(questions, answers);
  const canSubmit = isScreeningFormComplete(questions, answers);

  return (
    <FormScreen
      title="Screening questions"
      subtitle="Based on your responses, they may request your full application"
      onBack={() => router.back()}
      footer={
        <View style={styles.footer}>
          <OnboardingButton
            label={isSubmitting ? 'Submitting…' : 'Submit screening'}
            disabled={isSubmitting || !canSubmit}
            onPress={() => void submitScreening()}
          />
        </View>
      }
    >
      <View style={styles.content}>
        <ScreeningIntroCard />
        {questions.length > 0 ? (
          <Text style={styles.progress}>
            {answeredCount} of {questions.length} answered
          </Text>
        ) : null}
        <ScreeningQuestionList
          questions={questions}
          answers={answers}
          onChange={(key, value) =>
            setAnswers((current) => ({ ...current, [key]: value }))
          }
        />
      </View>
    </FormScreen>
  );
}
