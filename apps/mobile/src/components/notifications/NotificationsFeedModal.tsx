import { Modal, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NotificationsFeedBody } from '@/components/notifications/NotificationsFeedBody';
import { useThemedStyles } from '@/theme';

export type NotificationsFeedModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function NotificationsFeedModalBottom({ visible, onClose }: NotificationsFeedModalProps) {
  const insets = useSafeAreaInsets();

  const styles = useThemedStyles(({ colors, spacing }) => ({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    sheet: {
      maxHeight: '88%',
      backgroundColor: colors.backgroundGrouped,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      overflow: 'hidden',
    },
    handle: {
      alignSelf: 'center',
      width: 36,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.separator,
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
    },
  }));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
      onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}
          onPress={(event) => event.stopPropagation()}>
          <View style={styles.handle} />
          <NotificationsFeedBody visible={visible} onClose={onClose} variant="sheet" />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function NotificationsFeedModal(props: NotificationsFeedModalProps) {
  if (Platform.OS === 'web') {
    const { NotificationsFeedModal: WebNotificationsFeedModal } =
      require('./NotificationsFeedModal.web') as typeof import('./NotificationsFeedModal.web');
    return <WebNotificationsFeedModal {...props} />;
  }

  return <NotificationsFeedModalBottom {...props} />;
}
