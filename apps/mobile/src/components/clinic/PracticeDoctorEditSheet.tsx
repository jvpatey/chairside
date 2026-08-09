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
  PracticeDoctorEditSheetBody,
  type PracticeDoctorEditSheetProps,
} from '@/components/clinic/PracticeDoctorEditSheetBody';
import { useThemedStyles } from '@/theme';

export type { PracticeDoctorEditSheetProps };

export function PracticeDoctorEditSheetBottom(props: PracticeDoctorEditSheetProps) {
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
          accessibilityLabel="Close edit doctor sheet"
        />

        <View style={styles.sheet}>
          <View style={styles.handle} />
          <PracticeDoctorEditSheetBody {...props} variant="sheet" />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function PracticeDoctorEditSheet(props: PracticeDoctorEditSheetProps) {
  if (Platform.OS === 'web') {
    const { PracticeDoctorEditSheet: WebPracticeDoctorEditSheet } =
      require('./PracticeDoctorEditSheet.web') as typeof import('./PracticeDoctorEditSheet.web');
    return <WebPracticeDoctorEditSheet {...props} />;
  }

  return <PracticeDoctorEditSheetBottom {...props} />;
}
