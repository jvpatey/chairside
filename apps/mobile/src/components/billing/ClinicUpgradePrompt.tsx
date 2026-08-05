import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import {
  openClinicBillingModal,
  type ClinicBillingScrollFocus,
} from '@/components/billing/ClinicBillingModal';
import { useThemedStyles } from '@/theme';

export type { ClinicUpgradeReason } from '@/components/billing/clinicUpgradePromptCopy';
export {
  getClinicAddLocationUpgradeMessage,
  getClinicAddManagerUpgradeMessage,
  getClinicCrmUpgradeMessage,
  getClinicDiscoverUpgradeMessage,
  getClinicGeneralMessagingUpgradeMessage,
  getClinicBulkOutreachUpgradeMessage,
  getClinicHiringInsightsUpgradeMessage,
  getClinicOutreachUpgradeMessage,
  getClinicPdfExportUpgradeMessage,
  getClinicPublishLimitMessage,
  getClinicScreeningCapUpgradeMessage,
  getClinicScreeningUpgradeMessage,
  getClinicSmsUpgradeMessage,
  getClinicUpgradePromptMessage,
  getClinicUpgradePromptTitle,
} from '@/components/billing/clinicUpgradePromptCopy';

type ClinicUpgradePromptProps = {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  /** Scroll billing page to Group vs Clinic sections when opened. */
  billingFocus?: ClinicBillingScrollFocus;
};

export function ClinicUpgradePrompt({
  visible,
  title,
  message,
  onClose,
  billingFocus = 'default',
}: ClinicUpgradePromptProps) {
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
                openClinicBillingModal({ focus: billingFocus });
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
