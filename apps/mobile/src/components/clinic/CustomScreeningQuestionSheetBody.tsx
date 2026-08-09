import type { ScreeningQuestionType } from '@chairside/config';
import { useEffect, useState } from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import type { CustomScreeningQuestion } from '@/components/clinic/ScreeningToggleSection';
import {
  adaptiveSheetFooter,
  adaptiveSheetHeader,
  adaptiveSheetRoot,
  adaptiveSheetScroll,
  adaptiveSheetScrollContent,
  adaptiveSheetTitle,
} from '@/lib/adaptiveSheetBodyStyles';
import { useThemedStyles } from '@/theme';

const TYPE_OPTIONS = [
  { value: 'yes_no' as const, label: 'Yes / No' },
  { value: 'text' as const, label: 'Text answer' },
  { value: 'number' as const, label: 'Number' },
  { value: 'rating_1_5' as const, label: '1–5 rating' },
];

export type CustomScreeningQuestionSheetProps = {
  visible: boolean;
  onClose: () => void;
  onAdd: (question: CustomScreeningQuestion) => void;
  variant?: 'sheet' | 'dialog';
};

export function CustomScreeningQuestionSheetBody({
  visible,
  onClose,
  onAdd,
  variant = 'sheet',
}: CustomScreeningQuestionSheetProps) {
  const isDialog = variant === 'dialog';
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState<ScreeningQuestionType>('yes_no');

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    root: {
      gap: spacing.md,
      ...adaptiveSheetRoot(isDialog),
    },
    header: {
      paddingBottom: isDialog ? spacing.md : 0,
      ...adaptiveSheetHeader(isDialog, colors),
    },
    title: adaptiveSheetTitle(isDialog, colors, {
      ...typography.body,
      fontSize: 17,
      fontWeight: '600',
    }),
    scroll: adaptiveSheetScroll(isDialog, 420),
    scrollContent: adaptiveSheetScrollContent(isDialog, { gap: spacing.lg }),
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
    input: {
      fontSize: typography.body.fontSize,
      backgroundColor: colors.backgroundGrouped,
      borderWidth: 1,
      borderColor: colors.separator,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      color: colors.labelPrimary,
      minHeight: 88,
      textAlignVertical: 'top',
    },
    section: {
      gap: spacing.sm,
    },
    footer: {
      gap: spacing.sm,
      paddingTop: isDialog ? spacing.sm : spacing.md,
      ...adaptiveSheetFooter(isDialog, colors),
    },
  }));

  useEffect(() => {
    if (!visible) {
      setPrompt('');
      setType('yes_no');
    }
  }, [visible]);

  const dismissKeyboard = () => Keyboard.dismiss();

  const handleClose = () => {
    dismissKeyboard();
    onClose();
  };

  const handleAdd = () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    dismissKeyboard();
    onAdd({
      id: `custom_${Date.now()}`,
      prompt: trimmed,
      type,
    });
  };

  return (
    <Pressable style={styles.root} onPress={dismissKeyboard}>
      <View style={styles.header}>
        <Text style={styles.title}>Add custom question</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        bounces={false}>
        <View style={styles.section}>
          <Text style={styles.label}>Question</Text>
          <TextInput
            style={styles.input}
            placeholder="What would you like to ask applicants?"
            value={prompt}
            onChangeText={setPrompt}
            multiline
            autoCapitalize="sentences"
            returnKeyType="done"
            blurOnSubmit
            accessibilityLabel="Custom screening question"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Answer type</Text>
          <ChipSelector
            options={TYPE_OPTIONS}
            selected={type}
            onChange={(value) => {
              dismissKeyboard();
              setType(value as ScreeningQuestionType);
            }}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <OnboardingButton
          label="Add question"
          disabled={!prompt.trim()}
          onPress={handleAdd}
        />
        <OnboardingButton label="Cancel" variant="secondary" onPress={handleClose} />
      </View>
    </Pressable>
  );
}
