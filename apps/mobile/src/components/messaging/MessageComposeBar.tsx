import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';

import { useTheme, useThemedStyles } from '@/theme';

type MessageComposeBarProps = {
  disabled?: boolean;
  placeholder?: string;
  sending?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  onSend: (body: string) => Promise<void>;
};

export function MessageComposeBar({
  disabled = false,
  placeholder = 'Write a message…',
  sending = false,
  onFocus,
  onBlur,
  onSend,
}: MessageComposeBarProps) {
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [draft, setDraft] = useState('');

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    container: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
    },
    inputWrap: {
      flex: 1,
      minHeight: 44,
      maxHeight: 120,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    input: {
      ...typography.body,
      color: colors.labelPrimary,
      padding: 0,
      minHeight: 22,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    sendButtonDisabled: {
      opacity: 0.45,
    },
  }));

  const trimmed = draft.trim();
  const canSend = !disabled && !sending && trimmed.length > 0;

  const clearDraft = () => {
    inputRef.current?.clear();
    setDraft('');
  };

  const handleSend = async () => {
    if (!canSend) return;

    const body = trimmed;

    try {
      await onSend(body);
      clearDraft();
    } catch {
      // Parent shows the error; keep the draft in the input.
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputWrap}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          defaultValue=""
          onChangeText={setDraft}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.labelTertiary}
          multiline
          editable={!disabled && !sending}
          maxLength={2000}
          autoCorrect
          spellCheck
          autoCapitalize="sentences"
          blurOnSubmit={false}
          textAlignVertical="center"
        />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Send message"
        disabled={!canSend}
        onPress={() => {
          void handleSend();
        }}
        style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}>
        {sending ? (
          <ActivityIndicator color={colors.primaryOnPrimary} size="small" />
        ) : (
          <Ionicons name="send" size={18} color={colors.primaryOnPrimary} />
        )}
      </Pressable>
    </View>
  );
}
