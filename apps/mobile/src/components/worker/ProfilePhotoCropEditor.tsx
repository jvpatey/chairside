import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfilePhotoCropEditorContent } from '@/components/worker/ProfilePhotoCropEditorContent';
import { LiquidGlassSurface } from '@/components/ui/LiquidGlassSurface';
import { SHEET_ENTER } from '@/components/ui/sheetAnimations';
import type { ProfilePhotoCropTransform } from '@/lib/profilePhotoCrop';
import { useThemedStyles } from '@/theme';

type ProfilePhotoCropEditorProps = {
  visible: boolean;
  imageUri: string;
  imageWidth: number;
  imageHeight: number;
  isSaving?: boolean;
  onCancel: () => void;
  onConfirm: (transform: ProfilePhotoCropTransform) => void;
};

export function ProfilePhotoCropEditor({
  visible,
  imageUri,
  imageWidth,
  imageHeight,
  isSaving = false,
  onCancel,
  onConfirm,
}: ProfilePhotoCropEditorProps) {
  const insets = useSafeAreaInsets();

  const styles = useThemedStyles(({ spacing }) => ({
    root: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheetWrap: {
      maxHeight: '92%',
    },
    sheet: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: Math.max(insets.bottom, spacing.lg),
    },
    handle: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: 999,
      backgroundColor: 'rgba(128,128,128,0.35)',
      marginBottom: spacing.md,
    },
  }));

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onCancel}>
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel photo adjustment"
          style={StyleSheet.absoluteFill}
          onPress={isSaving ? undefined : onCancel}
        />
        {visible ? (
          <Animated.View entering={SHEET_ENTER} style={styles.sheetWrap}>
            <Pressable onPress={(event) => event.stopPropagation()}>
              <LiquidGlassSurface borderRadius={20} style={styles.sheet}>
                <View style={styles.handle} />
                <ProfilePhotoCropEditorContent
                  imageUri={imageUri}
                  imageWidth={imageWidth}
                  imageHeight={imageHeight}
                  isSaving={isSaving}
                  onCancel={onCancel}
                  onConfirm={onConfirm}
                />
              </LiquidGlassSurface>
            </Pressable>
          </Animated.View>
        ) : null}
      </View>
    </Modal>
  );
}
