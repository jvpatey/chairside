import type { ScreeningQuestionType } from '@chairside/config';
import {
  getDefaultScreeningSelection,
  SCREENING_CATEGORIES,
  SCREENING_CATEGORY_LABELS,
  getScreeningQuestionsByCategory,
} from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { LayoutAnimation, Modal, Platform, Pressable, Switch, Text, UIManager, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CustomScreeningQuestionSheet } from '@/components/clinic/CustomScreeningQuestionSheet';
import { ScreeningQuestionPicker } from '@/components/clinic/ScreeningQuestionPicker';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useTheme, useThemedStyles } from '@/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type CustomScreeningQuestion = {
  id: string;
  prompt: string;
  type: ScreeningQuestionType;
};

type ScreeningToggleSectionProps = {
  enabled: boolean;
  selectedCatalogSlugs: string[];
  customQuestions: CustomScreeningQuestion[];
  onEnabledChange: (enabled: boolean) => void;
  onSelectedCatalogSlugsChange: (slugs: string[]) => void;
  onCustomQuestionsChange: (questions: CustomScreeningQuestion[]) => void;
};

export function ScreeningToggleSection({
  enabled,
  selectedCatalogSlugs,
  customQuestions,
  onEnabledChange,
  onSelectedCatalogSlugsChange,
  onCustomQuestionsChange,
}: ScreeningToggleSectionProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [customSheetOpen, setCustomSheetOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const totalSelected = selectedCatalogSlugs.length + customQuestions.length;

  const previewQuestions = useMemo(() => {
    const preset = selectedCatalogSlugs
      .slice(0, 2)
      .map((slug) => getScreeningQuestionsByCategory('work_style').find((q) => q.slug === slug))
      .filter(Boolean);
    if (preset.length > 0) return preset;
    return getScreeningQuestionsByCategory('work_style').slice(0, 2);
  }, [selectedCatalogSlugs]);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    headerText: {
      flex: 1,
      gap: 4,
    },
    title: {
      ...typography.body,
      fontWeight: '600',
    },
    subtitle: {
      ...typography.subtitle,
      fontSize: 13,
    },
    body: {
      gap: spacing.md,
    },
    previewLink: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    addCustom: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.xs,
    },
    addCustomText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
    customList: {
      gap: spacing.sm,
    },
    customRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      backgroundColor: colors.backgroundGrouped,
      borderRadius: 12,
      padding: spacing.sm,
    },
    customPrompt: {
      ...typography.body,
      flex: 1,
      fontSize: 14,
    },
    customMeta: {
      ...typography.subtitle,
      fontSize: 12,
    },
    previewBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    previewSheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: Math.max(insets.bottom, spacing.lg),
      gap: spacing.md,
    },
    previewTitle: {
      ...typography.body,
      fontSize: 17,
      fontWeight: '600',
    },
    previewProgress: {
      height: 4,
      borderRadius: 999,
      backgroundColor: colors.separator,
      overflow: 'hidden',
    },
    previewProgressFill: {
      width: '25%',
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 999,
    },
    previewQuestion: {
      gap: spacing.sm,
      padding: spacing.md,
      backgroundColor: colors.backgroundGrouped,
      borderRadius: 12,
    },
    previewQuestionText: {
      ...typography.body,
      fontSize: 15,
    },
    previewPills: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    previewPill: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
      alignItems: 'center',
    },
    previewPillSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    previewPillText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    previewPillTextSelected: {
      color: colors.primaryOnPrimary,
    },
  }));

  const handleToggle = (next: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (next && selectedCatalogSlugs.length === 0 && customQuestions.length === 0) {
      onSelectedCatalogSlugsChange(getDefaultScreeningSelection());
    }
    onEnabledChange(next);
  };

  const removeCustomQuestion = (id: string) => {
    onCustomQuestionsChange(customQuestions.filter((question) => question.id !== id));
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Culture fit screening</Text>
          <Text style={styles.subtitle}>
            Optional questionnaire workers complete when they apply.
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={handleToggle}
          trackColor={{ false: colors.separator, true: colors.primary }}
          accessibilityLabel="Enable culture fit screening"
        />
      </View>

      {enabled ? (
        <View style={styles.body}>
          <Text style={styles.subtitle}>
            {totalSelected} question{totalSelected === 1 ? '' : 's'} selected
          </Text>

          {SCREENING_CATEGORIES.map((category) => (
            <ScreeningQuestionPicker
              key={category}
              category={category}
              categoryLabel={SCREENING_CATEGORY_LABELS[category]}
              questions={getScreeningQuestionsByCategory(category)}
              selectedSlugs={selectedCatalogSlugs}
              onChange={onSelectedCatalogSlugsChange}
            />
          ))}

          {customQuestions.length > 0 ? (
            <View style={styles.customList}>
              {customQuestions.map((question) => (
                <View key={question.id} style={styles.customRow}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.customPrompt}>{question.prompt}</Text>
                    <Text style={styles.customMeta}>
                      Custom · {question.type === 'yes_no' ? 'Yes / No' : '1–5 rating'}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Remove custom question"
                    hitSlop={8}
                    onPress={() => removeCustomQuestion(question.id)}>
                    <Ionicons name="trash-outline" size={20} color={colors.destructive} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          <Pressable
            style={styles.addCustom}
            accessibilityRole="button"
            onPress={() => setCustomSheetOpen(true)}>
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.addCustomText}>Add custom question</Text>
          </Pressable>

          <Pressable onPress={() => setPreviewOpen(true)} accessibilityRole="button">
            <Text style={styles.previewLink}>Preview worker experience</Text>
          </Pressable>
        </View>
      ) : null}

      <CustomScreeningQuestionSheet
        visible={customSheetOpen}
        onClose={() => setCustomSheetOpen(false)}
        onAdd={(question) => {
          onCustomQuestionsChange([...customQuestions, question]);
          setCustomSheetOpen(false);
        }}
      />

      <Modal visible={previewOpen} animationType="slide" transparent onRequestClose={() => setPreviewOpen(false)}>
        <Pressable style={styles.previewBackdrop} onPress={() => setPreviewOpen(false)}>
          <Pressable style={styles.previewSheet} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.previewTitle}>Worker preview</Text>
            <View style={styles.previewProgress}>
              <View style={styles.previewProgressFill} />
            </View>
            {previewQuestions.map((question) => (
              <View key={question!.slug} style={styles.previewQuestion}>
                <Text style={styles.previewQuestionText}>{question!.prompt}</Text>
                <View style={styles.previewPills}>
                  <View style={[styles.previewPill, styles.previewPillSelected]}>
                    <Text style={[styles.previewPillText, styles.previewPillTextSelected]}>Yes</Text>
                  </View>
                  <View style={styles.previewPill}>
                    <Text style={styles.previewPillText}>No</Text>
                  </View>
                </View>
              </View>
            ))}
            <OnboardingButton label="Close preview" variant="secondary" onPress={() => setPreviewOpen(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
