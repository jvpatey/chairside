import type { ScreeningQuestionType } from '@chairside/config';
import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import type { CustomScreeningQuestion } from '@/components/clinic/ScreeningToggleSection';
import { useThemedStyles } from '@/theme';

type CustomScreeningQuestionSheetProps = {
  visible: boolean;
  onClose: () => void;
  onAdd: (question: CustomScreeningQuestion) => void;
};

const TYPE_OPTIONS = [
  { value: 'yes_no' as const, label: 'Yes / No' },
  { value: 'rating_1_5' as const, label: '1–5 rating' },
];

export function CustomScreeningQuestionSheet({
  visible,
  onClose,
  onAdd,
}: CustomScreeningQuestionSheetProps) {
  const insets = useSafeAreaInsets();
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState<ScreeningQuestionType>('yes_no');

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: Math.max(insets.bottom, spacing.lg),
      gap: spacing.lg,
    },
    handle: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: 999,
      backgroundColor: colors.separator,
    },
    title: {
      ...typography.body,
      fontSize: 17,
      fontWeight: '600',
    },
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
    },
  }));

  useEffect(() => {
    if (!visible) {
      setPrompt('');
      setType('yes_no');
    }
  }, [visible]);

  const handleAdd = () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    onAdd({
      id: `custom_${Date.now()}`,
      prompt: trimmed,
      type,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Add custom question</Text>

          <View style={styles.section}>
            <Text style={styles.label}>Question</Text>
            <TextInput
              style={styles.input}
              placeholder="What would you like to ask applicants?"
              value={prompt}
              onChangeText={setPrompt}
              multiline
              autoCapitalize="sentences"
              accessibilityLabel="Custom screening question"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Answer type</Text>
            <ChipSelector
              options={TYPE_OPTIONS}
              selected={type}
              onChange={(value) => setType(value as ScreeningQuestionType)}
            />
          </View>

          <View style={styles.footer}>
            <OnboardingButton
              label="Add question"
              disabled={!prompt.trim()}
              onPress={handleAdd}
            />
            <OnboardingButton label="Cancel" variant="secondary" onPress={onClose} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
