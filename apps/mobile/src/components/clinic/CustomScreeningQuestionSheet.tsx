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
  CustomScreeningQuestionSheetBody,
  type CustomScreeningQuestionSheetProps,
} from '@/components/clinic/CustomScreeningQuestionSheetBody';
import { useThemedStyles } from '@/theme';

export type { CustomScreeningQuestionSheetProps };

export function CustomScreeningQuestionSheetBottom(props: CustomScreeningQuestionSheetProps) {
  const insets = useSafeAreaInsets();
  const { visible, onClose } = props;

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
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close custom question sheet"
        />

        <View style={styles.sheet}>
          <View style={styles.handle} />
          <CustomScreeningQuestionSheetBody {...props} variant="sheet" />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function CustomScreeningQuestionSheet(props: CustomScreeningQuestionSheetProps) {
  if (Platform.OS === 'web') {
    const { CustomScreeningQuestionSheet: WebCustomScreeningQuestionSheet } =
      require('./CustomScreeningQuestionSheet.web') as typeof import('./CustomScreeningQuestionSheet.web');
    return <WebCustomScreeningQuestionSheet {...props} />;
  }

  return <CustomScreeningQuestionSheetBottom {...props} />;
}
