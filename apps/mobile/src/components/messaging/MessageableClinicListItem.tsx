import type { MessageableClinic } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import { formatMessageableClinicMeta } from '@/lib/conversationDisplay';
import { useTheme, useThemedStyles } from '@/theme';

type MessageableClinicListItemProps = {
  clinic: MessageableClinic;
  onPress: () => void;
};

export function MessageableClinicListItem({ clinic, onPress }: MessageableClinicListItemProps) {
  const { colors } = useTheme();
  const logoUri = useClinicLogoUri(clinic.logo_storage_path);
  const meta = formatMessageableClinicMeta(clinic);
  const hasExistingConversation = Boolean(clinic.existing_conversation_id);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
    },
    cardPressed: { opacity: 0.92 },
    textWrap: { flex: 1, gap: 2 },
    eyebrow: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.labelSecondary,
    },
    name: {
      ...typography.body,
      fontSize: 20,
      lineHeight: 26,
      fontWeight: '700',
      letterSpacing: -0.2,
      color: colors.labelPrimary,
    },
    meta: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    description: {
      ...typography.subtitle,
      color: colors.labelSecondary,
    },
    status: {
      fontSize: 13,
      lineHeight: 18,
      color: hasExistingConversation ? colors.primary : colors.labelTertiary,
      fontWeight: hasExistingConversation ? '600' : '400',
    },
  }));

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <ClinicLogoAvatar clinicName={clinic.clinic_name} logoUri={logoUri} size={44} />
      <View style={styles.textWrap}>
        <Text style={styles.eyebrow}>Clinic</Text>
        <Text style={styles.name} numberOfLines={2}>
          {clinic.clinic_name}
        </Text>
        <Text style={styles.meta} numberOfLines={2}>
          {meta}
        </Text>
        {clinic.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {clinic.description}
          </Text>
        ) : null}
        <Text style={styles.status}>
          {hasExistingConversation ? 'Continue conversation' : 'Start a conversation'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.labelTertiary} />
    </Pressable>
  );
}
