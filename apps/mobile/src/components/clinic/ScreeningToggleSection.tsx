import type { ScreeningKnockoutRule, ScreeningQuestionType } from '@chairside/config';
import {
  CULTURE_FIT_CATEGORIES,
  formatScreeningQuestionTypeLabel,
  getDefaultScreeningSelection,
  getRecommendedCultureFitSelection,
  getScreeningQuestionsByCategory,
  SCREENING_CATEGORY_LABELS,
  supportsScreeningKnockout,
} from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState, type ReactNode } from 'react';
import { LayoutAnimation, Platform, Pressable, Text, TextInput, UIManager, View } from 'react-native';

import { CustomScreeningQuestionSheet } from '@/components/clinic/CustomScreeningQuestionSheet';
import { ScreeningQuestionPicker } from '@/components/clinic/ScreeningQuestionPicker';
import { ScreeningWorkerPreviewModal } from '@/components/clinic/ScreeningWorkerPreviewModal';
import { FormSectionHeader } from '@/components/ui/FormSectionHeader';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { ThemedSwitch } from '@/components/ui/ThemedSwitch';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { webPointer } from '@/lib/webPressableStyles';
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
  knockouts?: Record<string, ScreeningKnockoutRule | undefined>;
  onEnabledChange: (enabled: boolean) => void;
  onSelectedCatalogSlugsChange: (slugs: string[]) => void;
  onCustomQuestionsChange: (questions: CustomScreeningQuestion[]) => void;
  onKnockoutsChange?: (knockouts: Record<string, ScreeningKnockoutRule | undefined>) => void;
  /** When true, enabling screening shows an upgrade prompt instead. */
  locked?: boolean;
  onLockedPress?: () => void;
  /** Max custom questions for current plan. `null` = unlimited. */
  customScreeningLimit?: number | null;
  onCustomCapPress?: () => void;
};

function ScreeningSectionPanel({
  icon,
  label,
  hint,
  children,
  accent = 'tertiary',
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint: string;
  children: ReactNode;
  accent?: 'primary' | 'secondary' | 'tertiary';
}) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    panel: {
      gap: spacing.md,
      backgroundColor: colors.backgroundGrouped,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
    },
  }));

  return (
    <View style={styles.panel}>
      <FormSectionHeader icon={icon} label={label} hint={hint} accent={accent} />
      {children}
    </View>
  );
}

export function ScreeningToggleSection({
  enabled,
  selectedCatalogSlugs,
  customQuestions,
  knockouts = {},
  onEnabledChange,
  onSelectedCatalogSlugsChange,
  onCustomQuestionsChange,
  onKnockoutsChange,
  locked = false,
  onLockedPress,
  customScreeningLimit = null,
  onCustomCapPress,
}: ScreeningToggleSectionProps) {
  const { colors } = useTheme();
  const { clinicProfile } = useClinicProfile();
  const [customSheetOpen, setCustomSheetOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [cultureExpanded, setCultureExpanded] = useState(false);

  const promptContext = useMemo(
    () => ({ province: clinicProfile?.province ?? null }),
    [clinicProfile?.province],
  );

  const totalSelected = selectedCatalogSlugs.length + customQuestions.length;
  const customCapReached =
    customScreeningLimit != null && customQuestions.length >= customScreeningLimit;
  const qualificationCount = getScreeningQuestionsByCategory('qualifications').filter((question) =>
    selectedCatalogSlugs.includes(question.slug),
  ).length;

  const cultureSelectedCount = useMemo(
    () =>
      selectedCatalogSlugs.filter((slug) =>
        CULTURE_FIT_CATEGORIES.some((category) =>
          getScreeningQuestionsByCategory(category).some((question) => question.slug === slug),
        ),
      ).length,
    [selectedCatalogSlugs],
  );

  const expanded = enabled && !locked;
  const headerHint = locked
    ? 'Upgrade to Starter or Pro to filter unqualified candidates before requesting full applications.'
    : expanded
      ? 'Ask a short set of questions before requesting full applications. Culture fit is optional.'
      : undefined;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    headerText: {
      flex: 1,
      minWidth: 0,
    },
    switchWrap: {
      flexShrink: 0,
    },
    body: {
      gap: spacing.md,
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.sm,
    },
    metaPill: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: colors.primarySubtle,
      borderWidth: 1,
      borderColor: `${colors.primary}33`,
    },
    metaPillText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    cultureActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      alignItems: 'center',
    },
    secondaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
      ...webPointer(),
    },
    secondaryButtonPrimary: {
      backgroundColor: colors.primarySubtle,
      borderColor: `${colors.primary}33`,
    },
    secondaryButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    secondaryButtonTextPrimary: {
      color: colors.primary,
    },
    culturePickers: {
      gap: spacing.sm,
    },
    footerActions: {
      gap: spacing.sm,
      paddingTop: spacing.xs,
    },
    addCustom: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      ...webPointer(),
    },
    addCustomText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
    previewLink: {
      alignSelf: 'center',
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
      paddingVertical: spacing.xs,
    },
    customList: {
      gap: spacing.sm,
    },
    customRow: {
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.sm,
    },
    customTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
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
    knockoutCard: {
      gap: spacing.sm,
      paddingTop: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: colors.separator,
    },
    knockoutHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    knockoutLabel: {
      ...typography.subtitle,
      fontSize: 13,
      fontWeight: '600',
    },
    expectedRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    expectedChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.backgroundGrouped,
      ...webPointer(),
    },
    expectedChipSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySubtle,
    },
    expectedChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
    expectedChipTextSelected: {
      color: colors.primary,
    },
    numberRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    numberField: {
      flexGrow: 1,
      minWidth: 100,
      gap: 4,
    },
    numberLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.labelTertiary,
      textTransform: 'uppercase',
    },
    numberInput: {
      borderWidth: 1,
      borderColor: colors.separator,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: 14,
      color: colors.labelPrimary,
      backgroundColor: colors.backgroundGrouped,
    },
    capText: {
      ...typography.subtitle,
      fontSize: 13,
      color: colors.labelSecondary,
    },
    capLink: {
      ...typography.subtitle,
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
    emptyCulture: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelTertiary,
    },
  }));

  const setKnockout = (key: string, rule: ScreeningKnockoutRule | null) => {
    if (!onKnockoutsChange) return;
    const next = { ...knockouts };
    if (!rule?.enabled) {
      delete next[key];
    } else {
      next[key] = rule;
    }
    onKnockoutsChange(next);
  };

  const handleToggle = (next: boolean) => {
    if (locked && next) {
      onLockedPress?.();
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (next && selectedCatalogSlugs.length === 0 && customQuestions.length === 0) {
      onSelectedCatalogSlugsChange(getDefaultScreeningSelection());
    }
    onEnabledChange(next);
  };

  const addRecommendedCulture = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const recommended = getRecommendedCultureFitSelection();
    const merged = Array.from(new Set([...selectedCatalogSlugs, ...recommended]));
    onSelectedCatalogSlugsChange(merged);
    setCultureExpanded(true);
  };

  const removeCustomQuestion = (id: string) => {
    onCustomQuestionsChange(customQuestions.filter((question) => question.id !== id));
    setKnockout(id, null);
  };

  return (
    <SurfaceCard padding="md" gap={expanded}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <FormSectionHeader
            icon="clipboard-outline"
            label="Screening questions"
            accent="tertiary"
            hint={headerHint}
          />
        </View>
        <View style={styles.switchWrap}>
          <ThemedSwitch
            value={enabled && !locked}
            onValueChange={handleToggle}
            trackColorFalse={colors.separator}
            accessibilityLabel="Enable screening questions"
          />
        </View>
      </View>

      {expanded ? (
        <View style={styles.body}>
          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>
                {totalSelected} question{totalSelected === 1 ? '' : 's'}
              </Text>
            </View>
          </View>

          {customScreeningLimit != null ? (
            <Text style={styles.capText}>
              {customQuestions.length} of {customScreeningLimit} custom question
              {customScreeningLimit === 1 ? '' : 's'}
              {customCapReached ? (
                <>
                  {' · '}
                  <Text
                    accessibilityRole="button"
                    onPress={onCustomCapPress}
                    style={styles.capLink}>
                    Upgrade for unlimited
                  </Text>
                </>
              ) : null}
            </Text>
          ) : null}

          <ScreeningSectionPanel
            icon="ribbon-outline"
            label="Qualifications"
            hint={`${qualificationCount} selected · These questions help flag unqualified applicants. Turn on Must pass for deal-breakers.`}
            accent="tertiary">
            <ScreeningQuestionPicker
              category="qualifications"
              categoryLabel={SCREENING_CATEGORY_LABELS.qualifications}
              questions={getScreeningQuestionsByCategory('qualifications')}
              selectedSlugs={selectedCatalogSlugs}
              promptContext={promptContext}
              onChange={onSelectedCatalogSlugsChange}
              knockouts={knockouts}
              onKnockoutChange={onKnockoutsChange ? setKnockout : undefined}
              defaultExpanded
            />
          </ScreeningSectionPanel>

          <ScreeningSectionPanel
            icon="heart-outline"
            label="Culture & work style"
            hint={
              cultureSelectedCount > 0
                ? `${cultureSelectedCount} selected · Optional culture fit after qualifications.`
                : 'Optional. Add only if you want culture fit signals.'
            }
            accent="secondary">
            <View style={styles.cultureActions}>
              <Pressable
                style={[styles.secondaryButton, styles.secondaryButtonPrimary]}
                accessibilityRole="button"
                onPress={addRecommendedCulture}>
                <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
                <Text style={[styles.secondaryButtonText, styles.secondaryButtonTextPrimary]}>
                  Add recommended (4)
                </Text>
              </Pressable>
              <Pressable
                style={styles.secondaryButton}
                accessibilityRole="button"
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setCultureExpanded((current) => !current);
                }}>
                <Ionicons
                  name={cultureExpanded || cultureSelectedCount > 0 ? 'options-outline' : 'list-outline'}
                  size={16}
                  color={colors.labelPrimary}
                />
                <Text style={styles.secondaryButtonText}>
                  {cultureExpanded || cultureSelectedCount > 0 ? 'Customize' : 'Browse categories'}
                </Text>
              </Pressable>
            </View>

            {cultureExpanded || cultureSelectedCount > 0 ? (
              <View style={styles.culturePickers}>
                {CULTURE_FIT_CATEGORIES.map((category) => (
                  <ScreeningQuestionPicker
                    key={category}
                    category={category}
                    categoryLabel={SCREENING_CATEGORY_LABELS[category]}
                    questions={getScreeningQuestionsByCategory(category)}
                    selectedSlugs={selectedCatalogSlugs}
                    promptContext={promptContext}
                    onChange={onSelectedCatalogSlugsChange}
                    knockouts={knockouts}
                    onKnockoutChange={onKnockoutsChange ? setKnockout : undefined}
                    defaultExpanded={category === 'work_style'}
                  />
                ))}
              </View>
            ) : (
              <Text style={styles.emptyCulture}>
                No culture questions yet. Add 4 suggested questions or browse categories.
              </Text>
            )}
          </ScreeningSectionPanel>

          <ScreeningSectionPanel
            icon="create-outline"
            label="Custom questions"
            hint="Add your own yes/no, number, rating, or text questions."
            accent="primary">
            {customQuestions.length > 0 ? (
              <View style={styles.customList}>
                {customQuestions.map((question) => {
                  const knockout = knockouts[question.id];
                  const canKnockout = supportsScreeningKnockout(question.type) && onKnockoutsChange;
                  return (
                    <View key={question.id} style={styles.customRow}>
                      <View style={styles.customTop}>
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
                      {canKnockout ? (
                        <View style={styles.knockoutCard}>
                          <View style={styles.knockoutHeader}>
                            <Text style={styles.knockoutLabel}>Must pass</Text>
                            <ThemedSwitch
                              value={Boolean(knockout?.enabled)}
                              onValueChange={(next) => {
                                if (!next) {
                                  setKnockout(question.id, null);
                                  return;
                                }
                                setKnockout(question.id, {
                                  enabled: true,
                                  expectedBool: question.type === 'yes_no' ? true : null,
                                  min: question.type === 'number' ? 0 : null,
                                  max: null,
                                });
                              }}
                              trackColorFalse={colors.separator}
                              accessibilityLabel="Must pass for custom question"
                            />
                          </View>
                          {knockout?.enabled && question.type === 'yes_no' ? (
                            <View style={styles.expectedRow}>
                              {[
                                { value: true, label: 'Yes' },
                                { value: false, label: 'No' },
                              ].map((option) => {
                                const selectedExpected = knockout.expectedBool === option.value;
                                return (
                                  <Pressable
                                    key={option.label}
                                    onPress={() =>
                                      setKnockout(question.id, {
                                        ...knockout,
                                        expectedBool: option.value,
                                      })
                                    }
                                    style={[
                                      styles.expectedChip,
                                      selectedExpected && styles.expectedChipSelected,
                                    ]}>
                                    <Text
                                      style={[
                                        styles.expectedChipText,
                                        selectedExpected && styles.expectedChipTextSelected,
                                      ]}>
                                      {option.label}
                                    </Text>
                                  </Pressable>
                                );
                              })}
                            </View>
                          ) : null}
                          {knockout?.enabled && question.type === 'number' ? (
                            <View style={styles.numberRow}>
                              <View style={styles.numberField}>
                                <Text style={styles.numberLabel}>Min</Text>
                                <TextInput
                                  value={knockout.min != null ? String(knockout.min) : ''}
                                  onChangeText={(text) => {
                                    const parsed = text.trim() === '' ? null : Number(text);
                                    setKnockout(question.id, {
                                      ...knockout,
                                      min: parsed != null && !Number.isNaN(parsed) ? parsed : null,
                                    });
                                  }}
                                  keyboardType="numeric"
                                  placeholder="Any"
                                  placeholderTextColor={colors.labelTertiary}
                                  style={styles.numberInput}
                                />
                              </View>
                              <View style={styles.numberField}>
                                <Text style={styles.numberLabel}>Max</Text>
                                <TextInput
                                  value={knockout.max != null ? String(knockout.max) : ''}
                                  onChangeText={(text) => {
                                    const parsed = text.trim() === '' ? null : Number(text);
                                    setKnockout(question.id, {
                                      ...knockout,
                                      max: parsed != null && !Number.isNaN(parsed) ? parsed : null,
                                    });
                                  }}
                                  keyboardType="numeric"
                                  placeholder="Any"
                                  placeholderTextColor={colors.labelTertiary}
                                  style={styles.numberInput}
                                />
                              </View>
                            </View>
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ) : null}

            <Pressable
              style={[styles.addCustom, customCapReached && { opacity: 0.5 }]}
              accessibilityRole="button"
              accessibilityState={{ disabled: customCapReached }}
              onPress={() => {
                if (customCapReached) {
                  onCustomCapPress?.();
                  return;
                }
                setCustomSheetOpen(true);
              }}>
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.addCustomText}>
                {customCapReached ? 'Custom question limit reached' : 'Add custom question'}
              </Text>
            </Pressable>
          </ScreeningSectionPanel>

          <View style={styles.footerActions}>
            <Pressable onPress={() => setPreviewOpen(true)} accessibilityRole="button">
              <Text style={styles.previewLink}>Preview worker experience</Text>
            </Pressable>
          </View>
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
    </SurfaceCard>
  );
}
