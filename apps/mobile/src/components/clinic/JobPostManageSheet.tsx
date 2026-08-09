import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  JobPostManageSheetBody,
  type JobPostManageSheetProps,
} from '@/components/clinic/JobPostManageSheetBody';
import { useThemedStyles } from '@/theme';

export type { JobPostManageSheetProps };

export function JobPostManageSheetBottom(props: JobPostManageSheetProps) {
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
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close manage menu"
        />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <JobPostManageSheetBody {...props} variant="sheet" />
        </View>
      </View>
    </Modal>
  );
}

export function JobPostManageSheet(props: JobPostManageSheetProps) {
  if (Platform.OS === 'web') {
    const { JobPostManageSheet: WebJobPostManageSheet } =
      require('./JobPostManageSheet.web') as typeof import('./JobPostManageSheet.web');
    return <WebJobPostManageSheet {...props} />;
  }

  return <JobPostManageSheetBottom {...props} />;
}
