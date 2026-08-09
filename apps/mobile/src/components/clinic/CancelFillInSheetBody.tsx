import { getErrorMessage } from '@chairside/api';
import { useEffect, useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import {
  adaptiveSheetFooter,
  adaptiveSheetHeader,
  adaptiveSheetRoot,
  adaptiveSheetScroll,
  adaptiveSheetScrollContent,
  adaptiveSheetTitle,
} from '@/lib/adaptiveSheetBodyStyles';
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

export type CancelFillInSheetProps = {
  visible: boolean;
  workerName: string;
  mode?: CancelFillInSheetMode;
  onClose: () => void;
  onSubmit: (message: string) => Promise<void>;
  variant?: 'sheet' | 'dialog';
};

export function CancelFillInSheetBody({
  visible,
  workerName,
  mode = 'cancel',
  onClose,
  onSubmit,
  variant = 'sheet',
}: CancelFillInSheetProps) {
  const { colors } = useTheme();
  const isDialog = variant === 'dialog';
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
      gap: spacing.md,
      ...adaptiveSheetRoot(isDialog),
    },
    header: {
      gap: spacing.sm,
      paddingBottom: isDialog ? spacing.md : 0,
      ...adaptiveSheetHeader(isDialog, colors),
    },
    title: adaptiveSheetTitle(isDialog, colors, {
      ...typography.body,
      fontSize: 17,
      fontWeight: '600',
      color: colors.labelPrimary,
    }),
    subtitle: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 21,
      color: colors.labelSecondary,
    },
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
    footer: {
      gap: spacing.sm,
      paddingTop: isDialog ? spacing.sm : 0,
      ...adaptiveSheetFooter(isDialog, colors),
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
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.subtitle}>{copy.subtitle(workerName)}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
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
      </ScrollView>

      <View style={styles.footer}>
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
    </View>
  );
}
