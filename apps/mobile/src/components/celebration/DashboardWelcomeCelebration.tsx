import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConfettiBurst } from '@/components/celebration/ConfettiBurst';
import { DashboardWelcomeCelebrationContent } from '@/components/celebration/DashboardWelcomeCelebrationContent';
import { LiquidGlassSurface } from '@/components/ui/LiquidGlassSurface';
import { SHEET_ENTER } from '@/components/ui/sheetAnimations';
import type { DashboardWelcomeRole } from '@/lib/dashboardWelcomeCopy';
import { useThemedStyles } from '@/theme';

type DashboardWelcomeCelebrationProps = {
  visible: boolean;
  role: DashboardWelcomeRole;
  onDismiss: () => void;
};

export function DashboardWelcomeCelebration({
  visible,
  role,
  onDismiss,
}: DashboardWelcomeCelebrationProps) {
  const insets = useSafeAreaInsets();

  const styles = useThemedStyles(({ spacing }) => ({
    root: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheetWrap: {
      maxHeight: '85%',
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

  useEffect(() => {
    if (visible) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onDismiss}>
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss welcome celebration"
          style={StyleSheet.absoluteFill}
          onPress={onDismiss}
        />
        <ConfettiBurst active={visible} />
        {visible ? (
          <Animated.View entering={SHEET_ENTER} style={styles.sheetWrap}>
            <Pressable onPress={(event) => event.stopPropagation()}>
              <LiquidGlassSurface borderRadius={20} style={styles.sheet}>
                <View style={styles.handle} />
                <DashboardWelcomeCelebrationContent role={role} onDismiss={onDismiss} />
              </LiquidGlassSurface>
            </Pressable>
          </Animated.View>
        ) : null}
      </View>
    </Modal>
  );
}
