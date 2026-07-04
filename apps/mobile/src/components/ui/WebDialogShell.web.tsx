import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View, Animated, type StyleProp, type ViewStyle } from 'react-native';

import { LiquidGlassSurface } from '@/components/ui/LiquidGlassSurface';
import { useWebEscapeKey } from '@/hooks/useWebEscapeKey';
import { useDialogEnter } from '@/lib/webMotion.web';
import { webHover, webIconButtonHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { radii } from '@/theme/tokens';
import { useTheme, useThemedStyles } from '@/theme';
import { webTransition } from '@/theme/web';

type WebDialogShellProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: number;
  showCloseButton?: boolean;
  backdropLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** Centered glass dialog with backdrop blur and enter animation. */
export function WebDialogShell({
  visible,
  onClose,
  children,
  maxWidth = 420,
  showCloseButton = false,
  backdropLabel = 'Close dialog',
  style,
}: WebDialogShellProps) {
  const { colors } = useTheme();
  useWebEscapeKey(onClose, visible);
  const { opacity, scale } = useDialogEnter(visible);

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    root: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.32)',
      // @ts-expect-error web backdrop blur
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      ...webTransition(['background-color']),
    },
    panelWrap: {
      width: '100%',
      maxWidth,
      zIndex: 1,
    },
    panel: {
      padding: spacing.lg,
      gap: spacing.md,
      position: 'relative' as const,
    },
    closeButton: {
      position: 'absolute' as const,
      top: spacing.md,
      right: spacing.md,
      width: 32,
      height: 32,
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
      ...webPointer(),
    },
    closeButtonHovered: webIconButtonHoverStyles(colors),
    closeButtonPressed: {
      opacity: 0.75,
    },
  }));

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={backdropLabel}
        />
        <Animated.View
          style={[
            styles.panelWrap,
            {
              opacity,
              transform: [{ scale }],
            },
          ]}
        >
          <LiquidGlassSurface borderRadius={radii.xxl} style={style}>
            <View style={styles.panel}>
              {showCloseButton ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  onPress={onClose}
                  style={({ pressed, hovered }) => [
                    styles.closeButton,
                    webHover(hovered, pressed, styles.closeButtonHovered),
                    pressed && styles.closeButtonPressed,
                  ]}
                >
                  <Ionicons name="close" size={18} color={colors.labelSecondary} />
                </Pressable>
              ) : null}
              {children}
            </View>
          </LiquidGlassSurface>
        </Animated.View>
      </View>
    </Modal>
  );
}
