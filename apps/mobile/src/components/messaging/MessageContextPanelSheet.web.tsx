import type { Conversation } from '@chairside/api';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { MessageContextPanel } from '@/components/messaging/MessageContextPanel.web';
import { useWebEscapeKey } from '@/hooks/useWebEscapeKey';
import { useThemedStyles } from '@/theme';
import { webTransition } from '@/theme/web';

type MessageContextPanelSheetProps = {
  visible: boolean;
  onClose: () => void;
  conversation: Conversation | null;
  role: 'worker' | 'clinic';
  onNavigateAway?: () => void;
};

/** Right-side details sheet for message split view below xwide widths. */
export function MessageContextPanelSheet({
  visible,
  onClose,
  conversation,
  role,
  onNavigateAway,
}: MessageContextPanelSheetProps) {
  useWebEscapeKey(onClose, visible);

  const styles = useThemedStyles(({ colors, isDark }) => ({
    root: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.32)',
      // @ts-expect-error web backdrop blur
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      ...webTransition(['background-color']),
    },
    panel: {
      width: 360,
      maxWidth: '92%',
      height: '100%',
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: colors.separator,
      backgroundColor: colors.surface,
      zIndex: 1,
    },
  }));

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close details"
        />
        <View style={styles.panel}>
          <MessageContextPanel
            conversation={conversation}
            role={role}
            onCollapse={onClose}
            onNavigateAway={onNavigateAway ?? onClose}
          />
        </View>
      </View>
    </Modal>
  );
}
