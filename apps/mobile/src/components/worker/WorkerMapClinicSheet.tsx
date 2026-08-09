import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  WorkerMapClinicSheetBody,
  type WorkerMapClinicSheetProps,
} from '@/components/worker/WorkerMapClinicSheetBody';
import { useThemedStyles } from '@/theme';

export type { WorkerMapClinicSheetProps };

export function WorkerMapClinicSheetBottom(props: WorkerMapClinicSheetProps) {
  const insets = useSafeAreaInsets();
  const { visible, onClose, group } = props;

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
      paddingTop: spacing.sm,
      paddingBottom: Math.max(insets.bottom, spacing.lg),
      maxHeight: '78%',
    },
    handle: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: 999,
      backgroundColor: colors.separator,
      marginBottom: spacing.sm,
    },
  }));

  if (!group) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable accessibilityRole="button" style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <WorkerMapClinicSheetBody {...props} variant="sheet" />
        </View>
      </View>
    </Modal>
  );
}

export function WorkerMapClinicSheet(props: WorkerMapClinicSheetProps) {
  if (Platform.OS === 'web') {
    const { WorkerMapClinicSheet: WebWorkerMapClinicSheet } =
      require('./WorkerMapClinicSheet.web') as typeof import('./WorkerMapClinicSheet.web');
    return <WebWorkerMapClinicSheet {...props} />;
  }

  return <WorkerMapClinicSheetBottom {...props} />;
}
