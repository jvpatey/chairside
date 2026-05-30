import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { ConfettiBurst } from '@/components/celebration/ConfettiBurst';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import {
  getHiringCelebrationCopy,
  type HiringCelebrationPayload,
} from '@/lib/hiringCelebrationCopy';
import { useTheme, useThemedStyles } from '@/theme';

type HiringCelebrationModalProps = {
  visible: boolean;
  payload: HiringCelebrationPayload | null;
  onClose: () => void;
};

export function HiringCelebrationModal({ visible, payload, onClose }: HiringCelebrationModalProps) {
  const { colors } = useTheme();
  const copy = payload ? getHiringCelebrationCopy(payload) : null;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: spacing.xl,
      alignItems: 'center',
      gap: spacing.md,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    iconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primarySubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      ...typography.title,
      fontSize: 24,
      textAlign: 'center',
    },
    subtitle: {
      ...typography.subtitle,
      fontSize: 16,
      lineHeight: 22,
      textAlign: 'center',
    },
    button: {
      alignSelf: 'stretch',
      marginTop: spacing.sm,
    },
  }));

  useEffect(() => {
    if (visible && payload) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [payload, visible]);

  if (!copy) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss celebration"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <ConfettiBurst active={visible} />
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons
              name={copy.icon === 'calendar' ? 'calendar' : 'briefcase'}
              size={28}
              color={colors.primary}
            />
          </View>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>
          <OnboardingButton label="Done" onPress={onClose} style={styles.button} />
        </View>
      </View>
    </Modal>
  );
}
