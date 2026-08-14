import type { ScreeningPromptContext } from '@chairside/config';
import { useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { CustomScreeningQuestion } from '@/components/clinic/ScreeningToggleSection';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { ScreeningIntroCard } from '@/components/worker/screening/ScreeningIntroCard';
import { ScreeningQuestionList } from '@/components/worker/screening/ScreeningQuestionList';
import { buildPreviewScreeningQuestions } from '@/lib/screeningPreview';
import { useThemedStyles } from '@/theme';

type ScreeningWorkerPreviewModalProps = {
  visible: boolean;
  selectedCatalogSlugs: string[];
  customQuestions: CustomScreeningQuestion[];
  promptContext?: ScreeningPromptContext;
  onClose: () => void;
};

export function ScreeningWorkerPreviewModal({
  visible,
  selectedCatalogSlugs,
  customQuestions,
  promptContext,
  onClose,
}: ScreeningWorkerPreviewModalProps) {
  const insets = useSafeAreaInsets();

  const questions = useMemo(
    () => buildPreviewScreeningQuestions(selectedCatalogSlugs, customQuestions, promptContext),
    [customQuestions, promptContext, selectedCatalogSlugs],
  );
  const hasQuestions = questions.length > 0;

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
    title: {
      ...typography.body,
      fontWeight: '700',
      fontSize: 17,
    },
    emptyText: typography.subtitle,
    meta: typography.subtitle,
  }));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close worker preview"
        />

        <View style={styles.sheet}>
          {!hasQuestions ? (
            <>
              <Text style={styles.title}>Worker preview</Text>
              <Text style={styles.emptyText}>
                Select at least one screening question to preview what applicants will see.
              </Text>
              <OnboardingButton label="Close preview" variant="secondary" onPress={onClose} />
            </>
          ) : (
            <>
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}>
                <Text style={styles.title}>Worker preview</Text>
                <Text style={styles.meta}>
                  Applicants see all {questions.length} question
                  {questions.length === 1 ? '' : 's'} on one screen, then submit.
                </Text>
                <ScreeningIntroCard />
                <ScreeningQuestionList questions={questions} interactive={false} />
              </ScrollView>
              <OnboardingButton label="Close preview" variant="secondary" onPress={onClose} />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
