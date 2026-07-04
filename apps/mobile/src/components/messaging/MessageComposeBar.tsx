import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { clearMessageDraft, getMessageDraft, setMessageDraft } from '@/lib/messageDrafts';
import { webHover, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

const MESSAGE_BODY_MAX_LENGTH = 2000;
const NEAR_LIMIT_THRESHOLD = 1800;

type MessageComposeBarProps = {
  conversationId?: string;
  disabled?: boolean;
  disabledMessage?: string;
  placeholder?: string;
  sending?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  onChangeText?: (text: string) => void;
  onSend: (body: string) => Promise<void>;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function MessageComposeBar({
  conversationId,
  disabled = false,
  disabledMessage,
  placeholder = 'Write a message…',
  sending = false,
  onFocus,
  onBlur,
  onChangeText,
  onSend,
}: MessageComposeBarProps) {
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [draft, setDraft] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const sendScale = useSharedValue(1);
  const draftLoadedRef = useRef(false);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    container: {
      gap: spacing.xs,
    },
    disabledBanner: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
      paddingHorizontal: spacing.xs,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
    },
    inputColumn: {
      flex: 1,
      gap: spacing.xs,
    },
    inputWrap: {
      minHeight: 44,
      maxHeight: 120,
      borderRadius: 22,
      borderWidth: 1.5,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      ...(Platform.OS === 'web' ? { overflow: 'hidden' as const } : {}),
    },
    inputWrapFocused: {
      borderColor: colors.primary,
      ...(Platform.OS === 'web'
        ? ({
            // @ts-expect-error — boxShadow is web-only
            boxShadow: `0 0 0 3px ${colors.primarySubtle}`,
          } as const)
        : {}),
    },
    inputWrapDisabled: {
      opacity: 0.55,
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
    charCount: {
      alignSelf: 'flex-end',
      fontSize: 11,
      color: colors.labelTertiary,
      paddingHorizontal: spacing.xs,
    },
    charCountNearLimit: {
      color: colors.destructive,
      fontWeight: '600',
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

  useEffect(() => {
    draftLoadedRef.current = false;
    if (!conversationId) {
      setDraft('');
      return;
    }

    let cancelled = false;
    void getMessageDraft(conversationId).then((saved) => {
      if (cancelled) return;
      setDraft(saved);
      inputRef.current?.setNativeProps?.({ text: saved });
      draftLoadedRef.current = true;
    });

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  const trimmed = draft.trim();
  const canSend = !disabled && !sending && trimmed.length > 0;
  const showCharCount = draft.length >= NEAR_LIMIT_THRESHOLD;

  const sendButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }));

  const handleDraftChange = (next: string) => {
    setDraft(next);
    onChangeText?.(next);
    if (conversationId && draftLoadedRef.current) {
      void setMessageDraft(conversationId, next);
    }
  };

  const clearDraft = () => {
    inputRef.current?.clear();
    setDraft('');
    if (conversationId) {
      void clearMessageDraft(conversationId);
    }
  };

  const handleSend = async () => {
    if (!canSend) return;

    const body = trimmed;
    sendScale.value = withSequence(withSpring(0.9), withSpring(1));

    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      await onSend(body);
      clearDraft();
    } catch {
      // Parent shows the error; keep the draft in the input.
    }
  };

  const handleKeyPress = (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (Platform.OS !== 'web') return;
    if (event.nativeEvent.key !== 'Enter') return;
    if ((event.nativeEvent as TextInputKeyPressEventData & { shiftKey?: boolean }).shiftKey) {
      return;
    }
    event.preventDefault?.();
    void handleSend();
  };

  if (disabled) {
    return disabledMessage ? (
      <View style={styles.container}>
        <Text style={styles.disabledBanner}>{disabledMessage}</Text>
      </View>
    ) : null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.inputColumn}>
          <View style={[styles.inputWrap, isFocused && styles.inputWrapFocused]}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={draft}
              onChangeText={handleDraftChange}
              onFocus={() => {
                setIsFocused(true);
                onFocus?.();
              }}
              onBlur={() => {
                setIsFocused(false);
                onBlur?.();
              }}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              placeholderTextColor={colors.labelTertiary}
              multiline
              editable={!sending}
              maxLength={MESSAGE_BODY_MAX_LENGTH}
              autoCorrect
              spellCheck
              autoCapitalize="sentences"
              blurOnSubmit={false}
              textAlignVertical="center"
            />
          </View>
          {showCharCount ? (
            <Text
              style={[
                styles.charCount,
                draft.length >= MESSAGE_BODY_MAX_LENGTH && styles.charCountNearLimit,
              ]}>
              {draft.length}/{MESSAGE_BODY_MAX_LENGTH}
            </Text>
          ) : null}
        </View>
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel="Send message"
          disabled={!canSend}
          onPress={() => {
            void handleSend();
          }}
          style={({ pressed, hovered }) => [
            styles.sendButton,
            sendButtonAnimatedStyle,
            canSend && webPointer(),
            canSend && webHover(hovered, pressed, styles.sendButtonHovered),
            !canSend && styles.sendButtonDisabled,
          ]}>
          {sending ? (
            <ActivityIndicator color={colors.primaryOnPrimary} size="small" />
          ) : (
            <Ionicons name="send" size={18} color={colors.primaryOnPrimary} />
          )}
        </AnimatedPressable>
      </View>
    </View>
  );
}
