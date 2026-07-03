import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { openClinicBillingScreen } from '@/components/billing/ClinicBillingScreenContent';
import { useThemedStyles } from '@/theme';

type ClinicUpgradePromptProps = {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
};

export function ClinicUpgradePrompt({ visible, title, message, onClose }: ClinicUpgradePromptProps) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: spacing.lg,
      gap: spacing.md,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySubtle,
    },
    title: { ...typography.body, fontWeight: '700', fontSize: 18 },
    message: { ...typography.subtitle, fontSize: 15, lineHeight: 22 },
    actions: { gap: spacing.sm },
    close: { alignSelf: 'center', paddingVertical: spacing.sm },
    closeText: { ...typography.body, color: colors.labelSecondary },
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="sparkles-outline" size={22} color={styles.title.color} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <OnboardingButton
              label="View plans"
              onPress={() => {
                onClose();
                openClinicBillingScreen();
              }}
            />
            <Pressable style={styles.close} onPress={onClose}>
              <Text style={styles.closeText}>Not now</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function getClinicPublishLimitMessage(
  plan: 'free' | 'starter' | 'pro',
  publishType: 'role' | 'fill-in' = 'role',
): string {
  if (plan === 'free') {
    if (publishType === 'fill-in') {
      return 'Your free plan includes 1 active fill-in. Upgrade to publish more fill-ins.';
    }
    return 'Your free plan includes 1 active role. Upgrade to publish more roles.';
  }

  if (plan === 'starter') {
    if (publishType === 'fill-in') {
      return 'Your Starter plan includes 3 active fill-ins. Upgrade to Pro for unlimited posting.';
    }
    return 'Your Starter plan includes 3 active roles. Upgrade to Pro for unlimited posting.';
  }

  return 'Upgrade to Pro for unlimited active roles and fill-ins.';
}

export function getClinicOutreachUpgradeMessage(): string {
  return 'Direct fill-in outreach is available on Starter and Pro plans.';
}

export function getClinicSmsUpgradeMessage(): string {
  return 'SMS fill-in alerts are available on Starter and Pro plans.';
}
