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

type CancelFillInSheetProps = {
  visible: boolean;
  workerName: string;
  onClose: () => void;
  onSubmit: (message: string) => Promise<void>;
};

export function CancelFillInSheet({
  visible,
  workerName,
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

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      setError('Add a message for the candidate before cancelling.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(trimmed);
      onClose();
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Could not cancel fill-in.'));
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
              <Text style={styles.title}>Cancel fill-in?</Text>
              <Text style={styles.subtitle}>
                Let {workerName} know why this confirmed fill-in is being cancelled. They will see
                this message on their application.
              </Text>
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
                placeholder="Explain why the fill-in is being cancelled..."
                placeholderTextColor={colors.labelTertiary}
                multiline
                editable={!isSubmitting}
              />
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.actions}>
              <OnboardingButton
                label={isSubmitting ? 'Cancelling…' : 'Cancel fill-in'}
                variant="destructive"
                disabled={isSubmitting}
                onPress={() => void handleSubmit()}
              />
              <OnboardingButton
                label="Keep fill-in"
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
