import type { ScreeningQuestionType } from '@chairside/config';
import {
  formatScreeningQuestionTypeLabel,
  getDefaultScreeningSelection,
  SCREENING_CATEGORIES,
  SCREENING_CATEGORY_LABELS,
  getScreeningQuestionsByCategory,
} from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, Text, UIManager, View } from 'react-native';

import { CustomScreeningQuestionSheet } from '@/components/clinic/CustomScreeningQuestionSheet';
import { ScreeningQuestionPicker } from '@/components/clinic/ScreeningQuestionPicker';
import { ScreeningWorkerPreviewModal } from '@/components/clinic/ScreeningWorkerPreviewModal';
import { ThemedSwitch } from '@/components/ui/ThemedSwitch';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
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
  const { clinicProfile } = useClinicProfile();
  const [customSheetOpen, setCustomSheetOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const promptContext = useMemo(
    () => ({ province: clinicProfile?.province ?? null }),
    [clinicProfile?.province],
  );

  const totalSelected = selectedCatalogSlugs.length + customQuestions.length;

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
          <Text style={styles.title}>Screening questions</Text>
          <Text style={styles.subtitle}>
            Workers complete screening first. You can request their full application kit after
            reviewing responses.
          </Text>
        </View>
        <ThemedSwitch
          value={enabled}
          onValueChange={handleToggle}
          trackColorFalse={colors.separator}
          accessibilityLabel="Enable screening questions"
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
              promptContext={promptContext}
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
                      Custom · {formatScreeningQuestionTypeLabel(question.type)}
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

      <ScreeningWorkerPreviewModal
        visible={previewOpen}
        selectedCatalogSlugs={selectedCatalogSlugs}
        customQuestions={customQuestions}
        promptContext={promptContext}
        onClose={() => setPreviewOpen(false)}
      />
    </View>
  );
}
