import { Pressable, Text } from 'react-native';

import {
  openClinicBillingModal,
  type ClinicBillingScrollFocus,
} from '@/components/billing/ClinicBillingModal';
import { webPointer } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

type SetupBillingUpsellLinkProps = {
  label?: string;
  /** Scroll billing sheet to Group vs Clinic sections when opened. */
  focus?: ClinicBillingScrollFocus;
  /** Defaults to opening the setup-safe billing modal. */
  onPress?: () => void;
};

/** Non-blocking upgrade affordance for clinic setup — never replaces Continue. */
export function SetupBillingUpsellLink({
  label = 'Need more than Free allows? View plans',
  focus = 'group',
  onPress,
}: SetupBillingUpsellLinkProps) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    link: {
      alignSelf: 'center' as const,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      ...webPointer(),
    },
    label: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600' as const,
      color: colors.primary,
      textAlign: 'center' as const,
    },
  }));

  const handlePress = onPress ?? (() => openClinicBillingModal({ focus }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={handlePress}
      style={({ pressed }) => [styles.link, pressed && { opacity: 0.7 }]}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}
