import type { ScreeningQuestion } from '@chairside/api';
import type { RatingScaleValue, ScreeningPromptContext } from '@chairside/config';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { CustomScreeningQuestion } from '@/components/clinic/ScreeningToggleSection';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { NumberQuestionCard } from '@/components/worker/screening/NumberQuestionCard';
import { RatingQuestionCard } from '@/components/worker/screening/RatingQuestionCard';
import { ScreeningIntroCard } from '@/components/worker/screening/ScreeningIntroCard';
import { ScreeningWizardShell } from '@/components/worker/screening/ScreeningWizardShell';
import { TextQuestionCard } from '@/components/worker/screening/TextQuestionCard';
import { YesNoQuestionCard } from '@/components/worker/screening/YesNoQuestionCard';
import { buildPreviewScreeningQuestions } from '@/lib/screeningPreview';
import { buildScreeningWizardPages, getScreeningQuestionKey } from '@/lib/screeningWizard';
import { useThemedStyles } from '@/theme';

type ScreeningWorkerPreviewModalProps = {
  visible: boolean;
  selectedCatalogSlugs: string[];
  customQuestions: CustomScreeningQuestion[];
  promptContext?: ScreeningPromptContext;
  onClose: () => void;
};

function PreviewQuestion({ question }: { question: ScreeningQuestion }) {
  if (question.type === 'yes_no') {
    return (
      <View pointerEvents="none">
        <YesNoQuestionCard prompt={question.prompt} value={true} onChange={() => {}} />
      </View>
    );
  }

  if (question.type === 'number') {
    return (
      <View pointerEvents="none">
        <NumberQuestionCard
          prompt={question.prompt}
          value={question.min ?? 0}
          min={question.min}
          max={question.max}
          unitLabel={question.unitLabel}
          onChange={() => {}}
        />
      </View>
    );
  }

  if (question.type === 'text') {
    return (
      <View pointerEvents="none">
        <TextQuestionCard prompt={question.prompt} value="Sample answer" onChange={() => {}} />
      </View>
    );
  }

  return (
    <View pointerEvents="none">
      <RatingQuestionCard
        prompt={question.prompt}
        value={4 as RatingScaleValue}
        onChange={() => {}}
      />
    </View>
  );
}

export function ScreeningWorkerPreviewModal({
  visible,
  selectedCatalogSlugs,
  customQuestions,
  promptContext,
  onClose,
}: ScreeningWorkerPreviewModalProps) {
  const insets = useSafeAreaInsets();
  const [pageIndex, setPageIndex] = useState(0);

  const questions = useMemo(
    () => buildPreviewScreeningQuestions(selectedCatalogSlugs, customQuestions, promptContext),
    [customQuestions, promptContext, selectedCatalogSlugs],
  );

  const pages = useMemo(() => buildScreeningWizardPages(questions), [questions]);
  const currentPage = pages[pageIndex];
  const hasQuestions = questions.length > 0;

  useEffect(() => {
    if (visible) setPageIndex(0);
  }, [visible]);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    root: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: Math.max(insets.bottom, spacing.lg),
      maxHeight: '92%',
      gap: spacing.md,
    },
    scroll: {
      flexGrow: 0,
      flexShrink: 1,
    },
    scrollContent: {
      gap: spacing.md,
      paddingBottom: spacing.sm,
    },
    emptyText: typography.subtitle,
    reviewCard: {
      backgroundColor: colors.backgroundGrouped,
      borderRadius: 16,
      padding: spacing.md,
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
    navRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    navButton: {
      flex: 1,
    },
  }));

  const handleClose = () => {
    setPageIndex(0);
    onClose();
  };

  const pageTitle =
    currentPage?.kind === 'intro'
      ? 'Before you apply'
      : currentPage?.kind === 'review'
        ? 'Ready to submit'
        : currentPage?.kind === 'questions' && currentPage.questions[0]?.type === 'rating_1_5'
          ? 'Rate these attributes'
          : 'Screening questions';

  const pageSubtitle =
    currentPage?.kind === 'questions' && currentPage.questions[0]?.type === 'rating_1_5'
      ? '5 = Strongly agree · 1 = Not at all'
      : undefined;

  const canGoBack = pageIndex > 0;
  const canGoForward = pageIndex < pages.length - 1;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Close worker preview"
        />

        <View style={styles.sheet}>
          {!hasQuestions ? (
            <>
              <Text style={styles.reviewTitle}>Worker preview</Text>
              <Text style={styles.emptyText}>
                Select at least one screening question to preview what applicants will see.
              </Text>
              <OnboardingButton label="Close preview" variant="secondary" onPress={handleClose} />
            </>
          ) : currentPage ? (
            <>
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}>
                <ScreeningWizardShell
                  stepIndex={pageIndex}
                  totalSteps={pages.length}
                  title={pageTitle}
                  subtitle={pageSubtitle}>
                  {currentPage.kind === 'intro' ? <ScreeningIntroCard /> : null}

                  {currentPage.kind === 'questions'
                    ? currentPage.questions.map((question) => (
                        <PreviewQuestion key={getScreeningQuestionKey(question)} question={question} />
                      ))
                    : null}

                  {currentPage.kind === 'review' ? (
                    <View style={styles.reviewCard}>
                      <Text style={styles.reviewTitle}>Screening ready</Text>
                      <Text style={styles.reviewMeta}>
                        Applicants answer all {questions.length} screening question
                        {questions.length === 1 ? '' : 's'}, then submit for clinic review. You can
                        request their full application after reviewing responses.
                      </Text>
                    </View>
                  ) : null}
                </ScreeningWizardShell>
              </ScrollView>

              <View style={styles.footer}>
                <View style={styles.navRow}>
                  <View style={styles.navButton}>
                    <OnboardingButton
                      label="Previous"
                      variant="secondary"
                      disabled={!canGoBack}
                      onPress={() => setPageIndex((current) => Math.max(0, current - 1))}
                    />
                  </View>
                  <View style={styles.navButton}>
                    <OnboardingButton
                      label="Next"
                      disabled={!canGoForward}
                      onPress={() =>
                        setPageIndex((current) => Math.min(pages.length - 1, current + 1))
                      }
                    />
                  </View>
                </View>
                <OnboardingButton label="Close preview" variant="secondary" onPress={handleClose} />
              </View>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
