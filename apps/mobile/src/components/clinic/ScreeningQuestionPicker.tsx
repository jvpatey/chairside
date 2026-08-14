import type {
  ScreeningCatalogQuestion,
  ScreeningKnockoutRule,
  ScreeningPromptContext,
  ScreeningQuestionCategory,
  ScreeningQuestionType,
} from '@chairside/config';
import {
  formatScreeningPromptTemplate,
  supportsScreeningKnockout,
} from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, Text, TextInput, UIManager, View } from 'react-native';

import { ThemedSwitch } from '@/components/ui/ThemedSwitch';
import {
  webHover,
  webListRowHoverStyles,
  webPointer,
} from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ScreeningQuestionPickerProps = {
  category: ScreeningQuestionCategory;
  categoryLabel: string;
  questions: ScreeningCatalogQuestion[];
  selectedSlugs: string[];
  promptContext?: ScreeningPromptContext;
  onChange: (slugs: string[]) => void;
  knockouts?: Record<string, ScreeningKnockoutRule | undefined>;
  onKnockoutChange?: (slug: string, rule: ScreeningKnockoutRule | null) => void;
  /** Collapse by default when true. */
  defaultExpanded?: boolean;
};

function defaultKnockoutForType(type: ScreeningQuestionType): ScreeningKnockoutRule {
  if (type === 'yes_no') {
    return { enabled: true, expectedBool: true, min: null, max: null };
  }
  return { enabled: true, expectedBool: null, min: 0, max: null };
}

export function ScreeningQuestionPicker({
  categoryLabel,
  questions,
  selectedSlugs,
  promptContext,
  onChange,
  knockouts = {},
  onKnockoutChange,
  defaultExpanded = true,
}: ScreeningQuestionPickerProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);

  const selectedInCategory = useMemo(
    () => questions.filter((question) => selectedSlugs.includes(question.slug)).length,
    [questions, selectedSlugs],
  );

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      gap: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.xs,
      borderRadius: 10,
      ...webPointer(),
    },
    headerHovered: webListRowHoverStyles(colors),
    headerPressed: {
      opacity: 0.88,
    },
    headerText: {
      ...typography.body,
      fontSize: 14,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
    count: {
      color: colors.labelTertiary,
      fontWeight: '500',
    },
    list: {
      gap: spacing.sm,
    },
    row: {
      gap: spacing.xs,
    },
    rowMain: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 10,
      ...webPointer(),
    },
    rowHovered: webListRowHoverStyles(colors),
    rowPressed: {
      opacity: 0.88,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: colors.separator,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    checkboxSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    prompt: {
      ...typography.body,
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelPrimary,
    },
    knockoutCard: {
      marginLeft: 30,
      backgroundColor: colors.backgroundGrouped,
      borderRadius: 12,
      padding: spacing.sm,
      gap: spacing.sm,
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
      color: colors.labelPrimary,
      flex: 1,
    },
    knockoutHint: {
      ...typography.subtitle,
      fontSize: 12,
      color: colors.labelSecondary,
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
      backgroundColor: colors.surface,
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
      alignItems: 'center',
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
      letterSpacing: 0.3,
    },
    numberInput: {
      borderWidth: 1,
      borderColor: colors.separator,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: 14,
      color: colors.labelPrimary,
      backgroundColor: colors.surface,
    },
  }));

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((current) => !current);
  };

  const toggleSlug = (slug: string) => {
    if (selectedSlugs.includes(slug)) {
      onChange(selectedSlugs.filter((item) => item !== slug));
      onKnockoutChange?.(slug, null);
      return;
    }
    onChange([...selectedSlugs, slug]);
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ pressed, hovered }) => [
          styles.header,
          webHover(hovered, pressed, styles.headerHovered),
          pressed && styles.headerPressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={toggleExpanded}>
        <Text style={styles.headerText}>
          {categoryLabel}{' '}
          <Text style={styles.count}>
            ({selectedInCategory}/{questions.length})
          </Text>
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.labelTertiary}
        />
      </Pressable>

      {expanded ? (
        <View style={styles.list}>
          {questions.map((question) => {
            const selected = selectedSlugs.includes(question.slug);
            const knockout = knockouts[question.slug];
            const canKnockout = selected && supportsScreeningKnockout(question.type) && onKnockoutChange;

            return (
              <View key={question.slug} style={styles.row}>
                <Pressable
                  style={({ pressed, hovered }) => [
                    styles.rowMain,
                    webHover(hovered, pressed, styles.rowHovered),
                    pressed && styles.rowPressed,
                  ]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  onPress={() => toggleSlug(question.slug)}>
                  <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                    {selected ? (
                      <Ionicons name="checkmark" size={14} color={colors.primaryOnPrimary} />
                    ) : null}
                  </View>
                  <Text style={styles.prompt}>
                    {formatScreeningPromptTemplate(question.prompt, promptContext)}
                  </Text>
                </Pressable>

                {canKnockout ? (
                  <View style={styles.knockoutCard}>
                    <View style={styles.knockoutHeader}>
                      <Text style={styles.knockoutLabel}>Must pass</Text>
                      <ThemedSwitch
                        value={Boolean(knockout?.enabled)}
                        onValueChange={(next) => {
                          if (!next) {
                            onKnockoutChange(question.slug, null);
                            return;
                          }
                          onKnockoutChange(
                            question.slug,
                            knockout?.enabled
                              ? { ...knockout, enabled: true }
                              : defaultKnockoutForType(question.type),
                          );
                        }}
                        trackColorFalse={colors.separator}
                        accessibilityLabel={`Must pass for ${question.shortLabel}`}
                      />
                    </View>
                    {knockout?.enabled ? (
                      question.type === 'yes_no' ? (
                        <>
                          <Text style={styles.knockoutHint}>Required answer</Text>
                          <View style={styles.expectedRow}>
                            {[
                              { value: true, label: 'Yes' },
                              { value: false, label: 'No' },
                            ].map((option) => {
                              const selectedExpected = knockout.expectedBool === option.value;
                              return (
                                <Pressable
                                  key={option.label}
                                  accessibilityRole="button"
                                  accessibilityState={{ selected: selectedExpected }}
                                  onPress={() =>
                                    onKnockoutChange(question.slug, {
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
                        </>
                      ) : (
                        <>
                          <Text style={styles.knockoutHint}>
                            Allowed range{question.unitLabel ? ` (${question.unitLabel})` : ''}
                          </Text>
                          <View style={styles.numberRow}>
                            <View style={styles.numberField}>
                              <Text style={styles.numberLabel}>Min</Text>
                              <TextInput
                                value={knockout.min != null ? String(knockout.min) : ''}
                                onChangeText={(text) => {
                                  const parsed = text.trim() === '' ? null : Number(text);
                                  onKnockoutChange(question.slug, {
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
                                  onKnockoutChange(question.slug, {
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
                        </>
                      )
                    ) : (
                      <Text style={styles.knockoutHint}>
                        Flag applicants who do not meet this answer.
                      </Text>
                    )}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
