import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CancelFillInSheetBody,
  type CancelFillInSheetProps,
} from '@/components/clinic/CancelFillInSheetBody';
import { useThemedStyles } from '@/theme';

export type { CancelFillInSheetProps };

export function CancelFillInSheetBottom({
  visible,
  onClose,
  ...rest
}: CancelFillInSheetProps) {
  const insets = useSafeAreaInsets();

  const styles = useThemedStyles(({ colors, spacing }) => ({
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
    handle: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: 999,
      backgroundColor: colors.separator,
      marginBottom: spacing.md,
    },
  }));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <CancelFillInSheetBody visible={visible} onClose={onClose} {...rest} variant="sheet" />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function CancelFillInSheet(props: CancelFillInSheetProps) {
  if (Platform.OS === 'web') {
    const { CancelFillInSheet: WebCancelFillInSheet } =
      require('./CancelFillInSheetWeb') as typeof import('./CancelFillInSheetWeb');
    return <WebCancelFillInSheet {...props} />;
  }

  return <CancelFillInSheetBottom {...props} />;
}
