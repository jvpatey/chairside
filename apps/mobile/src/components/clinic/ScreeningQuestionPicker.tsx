import type { ScreeningCatalogQuestion, ScreeningPromptContext, ScreeningQuestionCategory } from '@chairside/config';
import { formatScreeningPromptTemplate } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, Text, UIManager, View } from 'react-native';

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
};

export function ScreeningQuestionPicker({
  categoryLabel,
  questions,
  selectedSlugs,
  promptContext,
  onChange,
}: ScreeningQuestionPickerProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(true);

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
      gap: spacing.xs,
    },
    row: {
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
  }));

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((current) => !current);
  };

  const toggleSlug = (slug: string) => {
    if (selectedSlugs.includes(slug)) {
      onChange(selectedSlugs.filter((item) => item !== slug));
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
            return (
              <Pressable
                key={question.slug}
                style={({ pressed, hovered }) => [
                  styles.row,
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
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
