import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  InterviewScheduleSheetBody,
  type InterviewScheduleSheetBodyProps,
  type InterviewScheduleSheetMode,
} from '@/components/clinic/InterviewScheduleSheetBody';
import { useThemedStyles } from '@/theme';

export type { InterviewScheduleSheetMode };

export type InterviewScheduleSheetProps = InterviewScheduleSheetBodyProps;

export function InterviewScheduleSheetBottom(props: InterviewScheduleSheetProps) {
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
    },
  }));

  const { visible, onClose } = props;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close interview scheduler"
        />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <InterviewScheduleSheetBody {...props} variant="sheet" />
        </View>
      </View>
    </Modal>
  );
}

export function InterviewScheduleSheet(props: InterviewScheduleSheetProps) {
  if (Platform.OS === 'web') {
    const { InterviewScheduleSheet: WebInterviewScheduleSheet } =
      require('./InterviewScheduleSheet.web') as typeof import('./InterviewScheduleSheet.web');
    return <WebInterviewScheduleSheet {...props} />;
  }

  return <InterviewScheduleSheetBottom {...props} />;
}
