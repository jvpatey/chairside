import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, TextInput, View } from 'react-native';

import { webHover, webPointer } from '@/lib/webPressableStyles';
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
  const [isFocused, setIsFocused] = useState(false);

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
      ...(Platform.OS === 'web' ? { overflow: 'hidden' as const } : {}),
    },
    inputWrapFocused: {
      borderColor: colors.primary,
    },
    input: {
      ...typography.body,
      color: colors.labelPrimary,
      padding: 0,
      minHeight: 22,
      ...(Platform.OS === 'web'
        ? {
            backgroundColor: 'transparent',
            outlineStyle: 'none' as const,
            borderWidth: 0,
            width: '100%',
          }
        : {}),
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      ...webPointer('default'),
    },
    sendButtonHovered: {
      opacity: 0.92,
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
      <View style={[styles.inputWrap, isFocused && styles.inputWrapFocused]}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          defaultValue=""
          onChangeText={setDraft}
          onFocus={() => {
            setIsFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
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
        style={({ pressed, hovered }) => [
          styles.sendButton,
          canSend && webPointer(),
          canSend && webHover(hovered, pressed, styles.sendButtonHovered),
          !canSend && styles.sendButtonDisabled,
        ]}>
        {sending ? (
          <ActivityIndicator color={colors.primaryOnPrimary} size="small" />
        ) : (
          <Ionicons name="send" size={18} color={colors.primaryOnPrimary} />
        )}
      </Pressable>
    </View>
  );
}
