import { getErrorMessage } from '@chairside/api';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useTheme, useThemedStyles } from '@/theme';

const MAX_MESSAGE_LENGTH = 500;

type CancelFillInSheetMode = 'cancel' | 'delete';

const COPY: Record<
  CancelFillInSheetMode,
  {
    title: string;
    subtitle: (workerName: string) => string;
    placeholder: string;
    submitLabel: string;
    submittingLabel: string;
    keepLabel: string;
    requiredError: string;
    submitError: string;
  }
> = {
  cancel: {
    title: 'Cancel fill-in?',
    subtitle: (workerName) =>
      `Let ${workerName} know why this confirmed fill-in is being cancelled. They will see this message on their application.`,
    placeholder: 'Explain why the fill-in is being cancelled...',
    submitLabel: 'Cancel fill-in',
    submittingLabel: 'Cancelling…',
    keepLabel: 'Keep fill-in',
    requiredError: 'Add a message for the candidate before cancelling.',
    submitError: 'Could not cancel fill-in.',
  },
  delete: {
    title: 'Delete fill-in?',
    subtitle: (workerName) =>
      `Let ${workerName} know why this fill-in is being removed. They will see this message in their history.`,
    placeholder: 'Explain why the fill-in is being removed...',
    submitLabel: 'Delete fill-in',
    submittingLabel: 'Deleting…',
    keepLabel: 'Keep fill-in',
    requiredError: 'Add a message for the candidate before deleting.',
    submitError: 'Could not delete fill-in.',
  },
};

type CancelFillInSheetProps = {
  visible: boolean;
  workerName: string;
  mode?: CancelFillInSheetMode;
  onClose: () => void;
  onSubmit: (message: string) => Promise<void>;
};

export function CancelFillInSheet({
  visible,
  workerName,
  mode = 'cancel',
  onClose,
  onSubmit,
}: CancelFillInSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setMessage('');
      setError(null);
      setIsSubmitting(false);
    }
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
    },
    scroll: {
      flexGrow: 0,
      flexShrink: 1,
    },
    scrollContent: {
      gap: spacing.lg,
    },
    handle: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: 999,
      backgroundColor: colors.separator,
      marginBottom: spacing.md,
    },
    title: {
      ...typography.body,
      fontSize: 17,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    subtitle: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 21,
      color: colors.labelSecondary,
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
      minHeight: 120,
      textAlignVertical: 'top',
    },
    section: {
      gap: spacing.sm,
    },
    error: {
      fontSize: 13,
      color: colors.destructive,
    },
    actions: {
      gap: spacing.sm,
    },
  }));

  const copy = COPY[mode];

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      setError(copy.requiredError);
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(trimmed);
      onClose();
    } catch (submitError) {
      setError(getErrorMessage(submitError, copy.submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            <View style={styles.section}>
              <Text style={styles.title}>{copy.title}</Text>
              <Text style={styles.subtitle}>{copy.subtitle(workerName)}</Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.label}>Message to candidate</Text>
              <TextInput
                style={styles.input}
                value={message}
                onChangeText={(value) => {
                  setMessage(value.slice(0, MAX_MESSAGE_LENGTH));
                  if (error) setError(null);
                }}
                placeholder={copy.placeholder}
                placeholderTextColor={colors.labelTertiary}
                multiline
                editable={!isSubmitting}
              />
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.actions}>
              <OnboardingButton
                label={isSubmitting ? copy.submittingLabel : copy.submitLabel}
                variant="destructive"
                disabled={isSubmitting}
                onPress={() => void handleSubmit()}
              />
              <OnboardingButton
                label={copy.keepLabel}
                variant="secondary"
                disabled={isSubmitting}
                onPress={onClose}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
