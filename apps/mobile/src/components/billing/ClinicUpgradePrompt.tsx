import type { ClinicPlan } from '@chairside/config';
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
  plan: ClinicPlan,
  publishType: 'role' | 'fill-in' = 'role',
): string {
  const postingLabel = publishType === 'fill-in' ? 'fill-in' : 'role';
  const postingLabelPlural = publishType === 'fill-in' ? 'fill-ins' : 'roles';

  if (plan === 'free') {
    return `Your free plan includes 1 active ${postingLabel}. Upgrade to publish more ${postingLabelPlural}.`;
  }

  if (plan === 'starter') {
    return `Your Starter plan includes 5 active ${postingLabelPlural}. Upgrade to Pro for unlimited posting.`;
  }

  if (plan === 'group_starter') {
    return `Your Group Starter plan includes 5 active ${postingLabelPlural} org-wide. Upgrade to Group Pro for unlimited posting.`;
  }

  return 'Upgrade your plan for unlimited active roles and fill-ins.';
}

export function getClinicOutreachUpgradeMessage(): string {
  return 'Direct fill-in outreach is available on Starter, Pro, and Group plans.';
}

export function getClinicSmsUpgradeMessage(): string {
  return 'SMS fill-in alerts are available on Starter, Pro, and Group plans.';
}
