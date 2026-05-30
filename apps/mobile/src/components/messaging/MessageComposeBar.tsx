import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';

import { useTheme, useThemedStyles } from '@/theme';

type MessageComposeBarProps = {
  disabled?: boolean;
  placeholder?: string;
  sending?: boolean;
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onSend: (body: string) => Promise<void>;
};

export function MessageComposeBar({
  disabled = false,
  placeholder = 'Write a message…',
  sending = false,
  value,
  onChangeText,
  onFocus,
  onBlur,
  onSend,
}: MessageComposeBarProps) {
  const { colors } = useTheme();

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

  const trimmed = value.trim();
  const canSend = !disabled && !sending && trimmed.length > 0;

  const handleSend = () => {
    if (!canSend) return;
    onChangeText('');
    void onSend(trimmed);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.labelTertiary}
          multiline
          editable={!disabled && !sending}
          maxLength={2000}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Send message"
        disabled={!canSend}
        onPress={handleSend}
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
